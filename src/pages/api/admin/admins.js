import { supabaseAdmin } from 'lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
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