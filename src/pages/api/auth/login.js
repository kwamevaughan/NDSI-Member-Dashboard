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

        // Check if user is approved (unless they are an admin)
        if (!user.is_admin && !user.is_approved) {
            return res.status(403).json({ 
                error: 'Your account is pending approval. You will receive an email notification once approved.',
                requiresApproval: true
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, is_admin: user.is_admin || false },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Update last_login_at and handle first time login
        let enforcePasswordChange = false;
        if (user.is_first_time) {
            enforcePasswordChange = true;
            // Do NOT set is_first_time to false here. Only update last_login_at.
            await supabaseAdmin
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', user.id);
        } else {
            // Just update last_login_at
            await supabaseAdmin
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', user.id);
        }

        return res.status(200).json({ token, user, enforcePasswordChange });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}