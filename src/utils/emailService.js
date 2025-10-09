import nodemailer from 'nodemailer';
import { supabaseAdmin } from 'lib/supabase';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Helper to fetch template by key and replace variables
async function getTemplate(key, variables = {}) {
    const { data: template } = await supabaseAdmin
        .from('email_templates')
        .select('subject, body_html, body_text')
        .eq('key', key)
        .single();
    if (!template) return null;
    // Replace variables in subject, html, and text
    let subject = template.subject;
    let html = template.body_html;
    let text = template.body_text;
    for (const [k, v] of Object.entries(variables)) {
        const re = new RegExp(`\\$\\{${k}\\}`, 'g');
        subject = subject.replace(re, v);
        html = html.replace(re, v);
        text = text.replace(re, v);
    }
    return { subject, html, text };
}

// Office365: The 'from' address must match the authenticated user (EMAIL_USER)
const FROM_EMAIL = process.env.EMAIL_FROM_NAME 
    ? `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`
    : process.env.EMAIL_USER;

export async function sendApprovalEmail(user, action, reason = null) {
    try {
        const displayName = user.full_name || 'User';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        const loginLink = `${baseUrl}/`;
        const variables = {
            displayName,
            loginLink,
            reason: reason || '',
            email: user.email,
            siteEmail: process.env.EMAIL_USER,
        };
        let templateKey = action === 'approve' ? 'user_approved' : 'user_rejected';
        let template = await getTemplate(templateKey, variables);
        // Fallback to hardcoded if not found
        if (!template) {
            if (action === 'approve') {
                template = {
                    subject: 'NDSI Account Approved - Welcome!',
                    text: `Hello ${displayName},\n\nGreat news! Your NDSI account has been approved. You can now log in to access the member dashboard and all available resources.\n\n${loginLink}\n\nBest,\nThe NDSI Team`,
                    html: `<div>Account approved for ${displayName}</div>`
                };
            } else {
                template = {
                    subject: 'NDSI Account Application Update',
                    text: `Hello ${displayName},\n\nWe regret to inform you that your NDSI account application has not been approved at this time.${reason ? `\n\nReason: ${reason}` : ''}\n\nIf you believe this was an error or would like to provide additional information, please contact us.\n\nBest,\nThe NDSI Team`,
                    html: `<div>Account rejected for ${displayName}</div>`
                };
            }
        }
        const mailOptions = {
            from: FROM_EMAIL,
            to: user.email,
            subject: template.subject,
            text: template.text,
            html: template.html,
        };
        await transporter.sendMail(mailOptions);
        console.log(`${action} email sent successfully to ${user.email}`);
    } catch (error) {
        console.error(`Error sending ${action} email:`, error);
        throw error;
    }
}

export async function sendDeletionEmail(user) {
    try {
        const displayName = user.full_name || 'User';
        const variables = {
            displayName,
            email: user.email,
            siteEmail: process.env.EMAIL_USER,
        };
        let template = await getTemplate('user_deleted', variables);
        // Fallback to hardcoded if not found
        if (!template) {
            template = {
                subject: 'NDSI Account Deleted',
                text: `Hello ${displayName},\n\nWe regret to inform you that your NDSI account has been permanently deleted by an administrator.\n\nIf you believe this was an error or have any questions, please contact us immediately.\n\nBest,\nThe NDSI Team`,
                html: `<div>Account deleted for ${displayName}</div>`
            };
        }
        const mailOptions = {
            from: FROM_EMAIL,
            to: user.email,
            subject: template.subject,
            text: template.text,
            html: template.html,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Deletion email sent successfully to ${user.email}`);
    } catch (error) {
        console.error('Error sending deletion email:', error);
        throw error;
    }
}

export async function sendAdminWelcomeEmail(user, password) {
    // (Leave as is for now, or refactor similarly if you want editable admin welcome template)
    try {
        const displayName = user.full_name || 'Administrator';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        const adminLoginLink = `${baseUrl}/admin/login`;
        const subject = 'NDSI Administrator Account Created - Welcome!';
        const text = `Hello ${displayName},\n\nWelcome to the NDSI team! Your administrator account has been created successfully.\n\nLogin Details:\nEmail: ${user.email}\nPassword: ${password}\n\nPlease log in at: ${adminLoginLink}\n\nImportant: Please change your password after your first login for security.\n\nBest regards,\nThe NDSI Team`;
        const html = `<div>Admin welcome for ${displayName}</div>`;
        const mailOptions = {
            from: FROM_EMAIL,
            to: user.email,
            subject: subject,
            text: text,
            html: html,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Admin welcome email sent successfully to ${user.email}`);
    } catch (error) {
        console.error('Error sending admin welcome email:', error);
        throw error;
    }
}

export async function sendWelcomeEmail(user) {
    try {
        const displayName = user.full_name || 'User';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        const loginLink = `${baseUrl}/login`;
        
        const variables = {
            displayName,
            loginLink,
            email: user.email,
            siteEmail: process.env.EMAIL_USER,
        };

        // Try to get template from database
        let template = await getTemplate('welcome_email', variables);
        
        // Fallback to hardcoded template if not found in database
        if (!template) {
            template = {
                subject: 'Welcome to NDSI!',
                text: `Hello ${displayName},\n\nThank you for registering with NDSI! We're excited to have you on board.\n\nYour account is currently pending approval. You will receive another email once your account has been approved and you can access all member features.\n\nIf you have any questions, feel free to reach out to us at ${process.env.EMAIL_USER}.\n\nBest regards,\nThe NDSI Team`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="https://ik.imagekit.io/3x197uc7r/NDSI/nds_logo.png" alt="NDSI Logo" style="max-width: 200px; height: auto;" />
                        </div>
                        <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h2 style="color: #28A8E0; font-size: 24px; margin-bottom: 15px;">Welcome to NDSI, ${displayName}!</h2>
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                Thank you for registering with NDSI! We're excited to have you on board.
                            </p>
                            <div style="background-color: #e8f4fc; border-left: 4px solid #28A8E0; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                                <p style="color: #0c5460; font-size: 14px; margin: 0;">
                                    <strong>Your account is currently pending approval.</strong> You will receive another email once your account has been approved and you can access all member features.
                                </p>
                            </div>
                            <p style="color: #666666; font-size: 14px; line-height: 1.5;">
                                If you have any questions, feel free to reach out to us at 
                                <a href="mailto:${process.env.EMAIL_USER}" style="color: #28A8E0; text-decoration: none;">${process.env.EMAIL_USER}</a>.
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
                `
            };
        }

        const mailOptions = {
            from: FROM_EMAIL,
            to: user.email,
            subject: template.subject,
            text: template.text,
            html: template.html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent successfully to ${user.email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
}

// Export a function to test the transporter connection
export async function testEmailConnection() {
    try {
        await transporter.verify();
        console.log('SMTP connection successful');
        return true;
    } catch (err) {
        console.error('SMTP connection failed:', err);
        return false;
    }
}