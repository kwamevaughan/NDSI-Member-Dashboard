// src/pages/api/auth/register.js
import { supabaseAdmin } from 'lib/supabase';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';
import { sendWelcomeEmail } from '../../../utils/emailService';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, full_name, organization_name, role_job_title, recaptchaToken } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (!normalizedEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
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
        console.log('reCAPTCHA response:', recaptchaData); // Debug log

        if (!recaptchaData.success || recaptchaData.score < 0.5) {
            return res.status(401).json({ error: 'reCAPTCHA verification failed', details: recaptchaData });
        }

        // Check for existing user
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

        // Register user with pending approval status
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data, error } = await supabaseAdmin
            .from('users')
            .insert({
                email: normalizedEmail,
                password: hashedPassword,
                full_name: full_name || null,
                organization_name: organization_name || null,
                role_job_title: role_job_title || null,
                is_approved: false, // New users need approval
                approval_status: 'pending', // pending, approved, rejected
                is_first_time: false, // User has already provided required info during registration
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Send welcome email asynchronously (do not await)
        (async () => {
            try {
                await sendWelcomeEmail({
                    email: normalizedEmail,
                    full_name: full_name
                });
                console.log('Welcome email sent successfully');
            } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
            }
        })();

        // Respond to client after user creation
        return res.status(201).json({ 
            message: 'Registration successful! Your account is pending approval. You will receive an email notification once approved.', 
            user: data,
            requiresApproval: true
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}