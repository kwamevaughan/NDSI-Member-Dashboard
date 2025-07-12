import { supabaseAdmin } from 'lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
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

    // Verify admin status
    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('is_admin')
            .eq('id', adminUser.id)
            .single();

        if (error || !user || !user.is_admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
    } catch (error) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
        // Get admin users only
        try {
            const { data: admins, error } = await supabaseAdmin
                .from('users')
                .select('id, email, full_name, created_at, is_admin')
                .eq('is_admin', true)
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
        // Create new admin user
        const { full_name, email, organization_name, password } = req.body;

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
                    is_admin: true,
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
} 