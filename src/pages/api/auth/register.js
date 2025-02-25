// src/pages/api/auth/register.js
import { supabaseAdmin } from 'lib/supabase';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, first_name, last_name, recaptchaToken } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (!normalizedEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

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
        const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('email', normalizedEmail)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabaseAdmin
            .from('users')
            .insert({
                email: normalizedEmail,
                password: hashedPassword,
                first_name: first_name || null,
                last_name: last_name || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return res.status(201).json({ message: 'User created successfully', user: data });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}