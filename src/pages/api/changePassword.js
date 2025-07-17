import { supabaseAdmin } from 'lib/supabase';
import bcrypt from 'bcrypt';
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

    const { currentPassword, newPassword } = req.body;
    if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
    }

    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('password, is_first_time')
            .eq('id', userId)
            .single();
        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If user is first time, allow password change without current password
        if (user.is_first_time) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({ password: hashedPassword, is_first_time: false })
                .eq('id', userId);
            if (updateError) {
                throw updateError;
            }
            return res.status(200).json({ message: 'Password changed successfully' });
        }

        // Otherwise, require current password
        if (!currentPassword) {
            return res.status(400).json({ error: 'Current password is required' });
        }
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', userId);
        if (updateError) {
            throw updateError;
        }
        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 