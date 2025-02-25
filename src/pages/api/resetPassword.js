// src/pages/api/resetPassword.js
import { supabaseAdmin } from 'lib/supabase';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
    }

    try {
        // Clean up expired tokens (optional)
        await supabaseAdmin
            .from('password_resets')
            .delete()
            .lt('expires_at', new Date().toISOString());

        const { data: resetData, error: resetError } = await supabaseAdmin
            .from('password_resets')
            .select('email, expires_at')
            .eq('token', token)
            .single();

        if (resetError || !resetData) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        if (new Date() > new Date(resetData.expires_at)) {
            return res.status(400).json({ error: 'Reset token has expired' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ password: hashedPassword })
            .eq('email', resetData.email);

        if (updateError) {
            throw new Error('Failed to update password');
        }

        await supabaseAdmin
            .from('password_resets')
            .delete()
            .eq('token', token);

        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}