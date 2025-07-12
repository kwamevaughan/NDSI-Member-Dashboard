import { supabaseAdmin } from 'lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    let userId;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { organization_name, role_job_title, full_name } = req.body;
    if (!organization_name && !role_job_title && !full_name) {
        return res.status(400).json({ error: 'No profile fields provided' });
    }

    try {
        const updateFields = {};
        if (organization_name !== undefined) updateFields.organization_name = organization_name;
        if (role_job_title !== undefined) updateFields.role_job_title = role_job_title;
        if (full_name !== undefined) updateFields.full_name = full_name;
        updateFields.updated_at = new Date().toISOString();



        const { data: user, error } = await supabaseAdmin
            .from('users')
            .update(updateFields)
            .eq('id', userId)
            .select()
            .single();
        if (error || !user) {
            return res.status(500).json({ error: 'Failed to update profile' });
        }
        return res.status(200).json({ user });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 