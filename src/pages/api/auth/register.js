// src/pages/api/auth/register.js
import { supabaseAdmin } from 'lib/supabase';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

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

        // Register user
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data, error } = await supabaseAdmin
            .from('users')
            .insert({
                email: normalizedEmail,
                password: hashedPassword,
                full_name: full_name || null,
                organization_name: organization_name || null,
                role_job_title: role_job_title || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Respond to client immediately after user creation
        res.status(201).json({ message: 'User created successfully', user: data });

        // Send welcome email asynchronously (do not await)
        (async () => {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: parseInt(process.env.EMAIL_PORT, 10),
                    secure: process.env.EMAIL_SECURE === 'true',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                const displayName = full_name || 'User';
                const protocol = req.headers['x-forwarded-proto'] || 'http';
                const host = req.headers['x-forwarded-host'] || req.headers.host;
                const baseUrl = `${protocol}://${host}`;
                const loginLink = `${baseUrl}/`;

                const mailOptions = {
                    from: `"NDSI Team" <${process.env.EMAIL_USER}>`,
                    to: normalizedEmail,
                    subject: 'Welcome to NDSI!',
                    text: `Hello ${displayName},\n\nWelcome to NDSI! We're thrilled to have you join us. Your account has been successfully created. Log in to explore resources, training, and more:\n\n${loginLink}\n\nBest,\nThe NDSI Team`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ececec; border-radius: 8px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="https://ik.imagekit.io/3x197uc7r/NDSI/nds_logo.png" alt="NDSI Logo" style="width: 200px; height: auto;" />
                            </div>
                            <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h2 style="color: #28A8E0; font-size: 24px; margin-bottom: 15px;">Hello ${displayName},</h2>
                                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                    Welcome to NDSI! We're thrilled to have you join us. Your account has been successfully created. Log in now to explore resources, training, and key strategic documents:
                                </p>
                                <div style="text-align: center; margin-bottom: 25px;">
                                    <a href="${loginLink}" style="background-color: #28A8E0; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">Log In</a>
                                </div>
                                <p style="color: #666666; font-size: 14px; line-height: 1.5;">
                                    If you have any questions, feel free to reach out to us at ${process.env.EMAIL_USER}.
                                </p>
                                <p style="color: #666666; font-size: 14px; line-height: 1.5; margin-top: 20px;">
                                    Best regards,<br />
                                    <span style="color: #8DC63F; font-weight: bold;">The NDSI Team</span>
                                </p>
                            </div>
                            <div style="text-align: center; margin-top: 20px; border-top: 1px solid #d9d9d9; padding-top: 15px;">
                                <p style="color: #999999; font-size: 12px;">© ${new Date().getFullYear()} NDSI. All rights reserved.</p>
                            </div>
                        </div>
                    `,
                };

                await transporter.sendMail(mailOptions);
                console.log('Welcome email sent successfully:');
            } catch (emailError) {
                console.error('Welcome email error:', emailError);
            }
        })();

        return res.status(201).json({ message: 'User created successfully', user: data });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}