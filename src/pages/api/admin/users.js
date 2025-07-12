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
        // Get pending users
        try {
            const { data: users, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('is_approved', false)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return res.status(200).json({ users });
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

            // Send email notification to user
            if (user) {
                const { sendApprovalEmail } = await import('../../../utils/emailService');
                await sendApprovalEmail(user, action, reason);
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
} 