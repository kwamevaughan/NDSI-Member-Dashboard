// src/pages/api/auth/login.js
import { supabaseAdmin } from 'lib/supabase';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, recaptchaToken } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Verify reCAPTCHA token
    const recaptchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
        }
    );
    const recaptchaData = await recaptchaResponse.json();
    if (!recaptchaData.success || recaptchaData.score < 0.5) {
        return res.status(401).json({ error: 'reCAPTCHA verification failed' });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

        if (error || !data) {
            return res.status(401).json({ error: 'User not found' });
        }

        const isValid = await bcrypt.compare(password, data.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: data.id, email: data.email }, JWT_SECRET, { expiresIn: '1h' });

        await supabaseAdmin
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.id);

        return res.status(200).json({ token, user: data });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}