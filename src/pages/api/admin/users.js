import { supabaseAdmin } from 'lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
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
            .select('role')
            .eq('id', adminUser.id)
            .single();

        if (error || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
    } catch (error) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
        // Get pending users
        try {
            // First, get all non-admin users
            const { data: users, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('role', 'user')  // Only show non-admin users
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            // Get admin names for users who have been approved/rejected
            const adminIds = users
                .filter(user => user.approved_by)
                .map(user => user.approved_by);

            let adminNames = {};
            if (adminIds.length > 0) {
                const { data: admins, error: adminError } = await supabaseAdmin
                    .from('users')
                    .select('id, full_name, email')
                    .in('id', adminIds);

                if (!adminError && admins) {
                    admins.forEach(admin => {
                        adminNames[admin.id] = admin.full_name || admin.email;
                    });
                }
            }

            // Add admin names to user data
            const usersWithAdminNames = users.map(user => ({
                ...user,
                approved_by_name: user.approved_by ? adminNames[user.approved_by] : null
            }));

            return res.status(200).json({ users: usersWithAdminNames });
        } catch (error) {
            console.error('Error fetching pending users:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    if (req.method === 'POST') {
        // Approve or reject user
        const { userId, action, reason } = req.body;

        if (!userId || !action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid request parameters' });
        }

        try {
            const updateData = {
                is_approved: action === 'approve',
                approval_status: action === 'approve' ? 'approved' : 'rejected',
                approved_by: adminUser.id,
                approved_at: new Date().toISOString(),
                rejection_reason: action === 'reject' ? reason : null,
                updated_at: new Date().toISOString()
            };

            const { data: user, error } = await supabaseAdmin
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Check notification settings
            const { data: settings } = await supabaseAdmin
                .from('settings')
                .select('notify_on_approve, notify_on_reject')
                .eq('id', 1)
                .single();

            // Send email notification to user if enabled
            if (user) {
                const { sendApprovalEmail } = await import('../../../utils/emailService');
                if (action === 'approve' && settings?.notify_on_approve) {
                    await sendApprovalEmail(user, action, reason);
                } else if (action === 'reject' && settings?.notify_on_reject) {
                    await sendApprovalEmail(user, action, reason);
                }
            }

            return res.status(200).json({ 
                message: `User ${action}d successfully`,
                user 
            });
        } catch (error) {
            console.error('Error updating user approval:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    if (req.method === 'DELETE') {
        // Delete user
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        try {
            // First, get the user to check if they exist and for email notification
            const { data: user, error: fetchError } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (fetchError || !user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Prevent admin from deleting themselves
            if (user.id === adminUser.id) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            // Delete the user
            const { error: deleteError } = await supabaseAdmin
                .from('users')
                .delete()
                .eq('id', userId);

            if (deleteError) {
                throw deleteError;
            }

            // Check notification setting
            const { data: settings } = await supabaseAdmin
                .from('settings')
                .select('notify_on_delete')
                .eq('id', 1)
                .single();

            // Send email notification to user about deletion if enabled
            if (settings?.notify_on_delete) {
                try {
                    const { sendDeletionEmail } = await import('../../../utils/emailService');
                    await sendDeletionEmail(user);
                } catch (emailError) {
                    console.error('Error sending deletion email:', emailError);
                    // Don't fail the deletion if email fails
                }
            }

            return res.status(200).json({ 
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
} 