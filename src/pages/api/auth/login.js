// src/pages/api/auth/login.js
import { supabaseAdmin } from 'lib/supabase';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

export default async function handler(req, res) {
    console.log('Login API called with method:', req.method);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, recaptchaToken, isAutoLogin } = req.body;
    const normalizedEmail = email.toLowerCase();
    
    console.log('Login attempt for:', normalizedEmail, 'hasPassword:', !!password, 'hasRecaptcha:', !!recaptchaToken);

    if (!normalizedEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Only verify reCAPTCHA if token is provided and not an auto-login
    if (recaptchaToken && !isAutoLogin) {
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
    } else if (!recaptchaToken && !isAutoLogin) {
        return res.status(401).json({ error: 'reCAPTCHA verification required' });
    } else if (isAutoLogin) {
        console.log('Auto-login detected - skipping reCAPTCHA verification');
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
        // Allow unapproved users to log in but mark them as pending
        const isPendingApproval = user.role === 'user' && !user.is_approved;
        
        console.log('User found:', { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            is_approved: user.is_approved,
            approval_status: user.approval_status,
            isPendingApproval 
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
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

        return res.status(200).json({ 
            token, 
            user, 
            enforcePasswordChange,
            isPendingApproval 
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}