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
            from: `"NDSI Team" <${process.env.EMAIL_USER}>`,
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
            from: `"NDSI Team" <${process.env.EMAIL_USER}>`,
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
            from: `"NDSI Team" <${process.env.EMAIL_USER}>`,
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