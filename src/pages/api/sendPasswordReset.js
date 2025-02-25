// src/pages/api/sendPasswordReset.js
import { supabaseAdmin } from 'lib/supabase';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (!normalizedEmail) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('email, first_name') // Fetch first_name
            .eq('email', normalizedEmail)
            .single();

        if (userError || !user) {
            return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const { error: insertError } = await supabaseAdmin
            .from('password_resets')
            .insert({
                email: normalizedEmail,
                token: resetToken,
                expires_at: expiresAt,
            });

        if (insertError) {
            throw new Error('Failed to store reset token');
        }

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const baseUrl = `${protocol}://${host}`;
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            debug: true,
            logger: true,
        });

        const firstName = user.first_name || 'User'; // Default to 'User' if no first_name
        const mailOptions = {
            from: `"NDSI Team" <${process.env.EMAIL_USER}>`, // Branded sender
            to: normalizedEmail,
            subject: 'Reset Your NDSI Password',
            text: `Hi ${firstName},\n\nYou recently requested to reset your password for your NDSI account. Click the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in 1 hour. If you didn’t request a reset, you can safely ignore this email.\n\nBest,\nThe NDSI Team`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ececec; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://yourdomain.com/assets/images/logo.svg" alt="NDSI Logo" style="width: 200px; height: auto;" />
                    </div>
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #28A8E0; font-size: 24px; margin-bottom: 10px;">Hi ${firstName},</h2>
                        <p style="color: #333333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                            You recently requested to reset your password for your NDSI account. Click the button below to set a new password:
                        </p>
                        <div style="text-align: center; margin-bottom: 20px;">
                            <a href="${resetLink}" style="background-color: #28A8E0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block; transition: background-color 0.3s;">Reset Password</a>
                        </div>
                        <p style="color: #666666; font-size: 14px; line-height: 1.5;">
                            This link will expire in 1 hour. If you didn’t request a password reset, you can safely ignore this email.
                        </p>
                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin-top: 20px;">
                            Best regards,<br />
                            <span style="color: #8DC63F; font-weight: bold;">The NDSI Team</span>
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="color: #999999; font-size: 12px;">© ${new Date().getFullYear()} NDSI. All rights reserved.</p>
                    </div>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', mailOptions);
        } catch (emailError) {
            console.error('Email send error:', emailError);
            throw emailError;
        }

        return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}