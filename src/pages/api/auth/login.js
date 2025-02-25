// src/pages/api/auth/login.js
import { supabaseAdmin } from 'lib/supabase';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, recaptchaToken } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (!normalizedEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Only verify reCAPTCHA if token is provided
    if (recaptchaToken) {
        const recaptchaResponse = await fetch(
            `https://www.google.com/recaptcha/api/siteverify`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
            }
        );
        const recaptchaData = await recaptchaResponse.json();
        if (!recaptchaData.success) {
            return res.status(401).json({ error: 'reCAPTCHA verification failed' });
        }
    }

    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({ token, user });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}