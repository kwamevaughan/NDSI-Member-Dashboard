import { supabaseAdmin } from 'lib/supabase';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let adminUser;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        adminUser = decoded;
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify admin status and get super admin status
    let currentAdmin;
    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', adminUser.id)
            .single();

        if (error || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        currentAdmin = user;
    } catch (error) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
        // Get admin users only
        try {
            const { data: admins, error } = await supabaseAdmin
                .from('users')
                .select('id, email, full_name, created_at, role')
                .in('role', ['admin','super_admin'])
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return res.status(200).json({ admins });
        } catch (error) {
            console.error('Error fetching admin users:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    if (req.method === 'POST') {
        // Only super admins can create new admins
        if (currentAdmin.role !== 'super_admin') {
            return res.status(403).json({ error: 'Super admin access required to create new administrators' });
        }

        // Create new admin user
        const { full_name, email, organization_name, password, role = 'admin' } = req.body;

        // Validation
        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Full name, email, and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check if email already exists
        try {
            const { data: existingUser, error: checkError } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase())
                .single();

            if (existingUser) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }
        } catch (error) {
            // User doesn't exist, which is what we want
        }

        try {
            // Create the new admin user
            const { data: newAdmin, error: createError } = await supabaseAdmin
                .from('users')
                .insert({
                    full_name: full_name.trim(),
                    email: email.toLowerCase().trim(),
                    organization_name: organization_name?.trim() || null,
                    password: password, // This will be hashed by Supabase
                    role: role, // 'admin' or 'super_admin'
                    is_approved: true, // Admins are automatically approved
                    approval_status: 'approved',
                    approved_by: adminUser.id,
                    approved_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating admin user:', createError);
                return res.status(500).json({ error: 'Failed to create admin user' });
            }

            // Send welcome email to new admin
            try {
                const { sendAdminWelcomeEmail } = await import('../../../utils/emailService');
                await sendAdminWelcomeEmail(newAdmin, password);
            } catch (emailError) {
                console.error('Error sending admin welcome email:', emailError);
                // Don't fail the creation if email fails
            }

            return res.status(201).json({ 
                message: 'Admin user created successfully',
                admin: {
                    id: newAdmin.id,
                    email: newAdmin.email,
                    full_name: newAdmin.full_name
                }
            });
        } catch (error) {
            console.error('Error creating admin user:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    if (req.method === 'PUT') {
        // Only super admins can modify admins
        if (currentAdmin.role !== 'super_admin') {
            return res.status(403).json({ error: 'Super admin access required to modify administrators' });
        }

        const { adminId, full_name, email, organization_name, role, password } = req.body;

        if (!adminId) {
            return res.status(400).json({ error: 'Admin ID is required' });
        }

        // Prevent admin from modifying themselves
        if (adminId === adminUser.id) {
            return res.status(400).json({ error: 'Cannot modify your own account through this endpoint' });
        }

        try {
            const updateData = {
                full_name: full_name?.trim(),
                email: email?.toLowerCase().trim(),
                organization_name: organization_name?.trim() || null,
                role: role, // 'admin' or 'super_admin'
                updated_at: new Date().toISOString()
            };

            // If password is provided, hash and update
            if (password && password.length > 0) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateData.password = hashedPassword;
            }

            // Remove undefined values
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

            const { data: updatedAdmin, error } = await supabaseAdmin
                .from('users')
                .update(updateData)
                .eq('id', adminId)
                .in('role', ['admin','super_admin']) // Only update admin/super_admin
                .select()
                .single();

            if (error) {
                throw error;
            }

            return res.status(200).json({ 
                message: 'Admin updated successfully',
                admin: updatedAdmin
            });
        } catch (error) {
            console.error('Error updating admin:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    if (req.method === 'DELETE') {
        // Only super admins can delete admins
        if (currentAdmin.role !== 'super_admin') {
            return res.status(403).json({ error: 'Super admin access required to delete administrators' });
        }

        const { adminId } = req.body;

        if (!adminId) {
            return res.status(400).json({ error: 'Admin ID is required' });
        }

        // Prevent admin from deleting themselves
        if (adminId === adminUser.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        try {
            // Get admin details before deletion
            const { data: adminToDelete, error: fetchError } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', adminId)
                .in('role', ['admin','super_admin'])
                .single();

            if (fetchError || !adminToDelete) {
                return res.status(404).json({ error: 'Admin not found' });
            }

            // Delete the admin
            const { error: deleteError } = await supabaseAdmin
                .from('users')
                .delete()
                .eq('id', adminId);

            if (deleteError) {
                throw deleteError;
            }

            // Send deletion notification email
            try {
                const { sendDeletionEmail } = await import('../../../utils/emailService');
                await sendDeletionEmail(adminToDelete);
            } catch (emailError) {
                console.error('Error sending deletion email:', emailError);
                // Don't fail the deletion if email fails
            }

            return res.status(200).json({ 
                message: 'Admin deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting admin:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
} 