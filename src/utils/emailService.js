import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendApprovalEmail(user, action, reason = null) {
    try {
        const displayName = user.full_name || user.first_name || 'User';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        const loginLink = `${baseUrl}/`;

        let subject, text, html;

        if (action === 'approve') {
            subject = 'NDSI Account Approved - Welcome!';
            text = `Hello ${displayName},\n\nGreat news! Your NDSI account has been approved. You can now log in to access the member dashboard and all available resources.\n\n${loginLink}\n\nBest,\nThe NDSI Team`;
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ececec; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://ik.imagekit.io/3x197uc7r/NDSI/nds_logo.png" alt="NDSI Logo" style="width: 200px; height: auto;" />
                    </div>
                    <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #28A8E0; font-size: 24px; margin-bottom: 15px;">Hello ${displayName},</h2>
                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Great news! Your NDSI account has been approved. You can now log in to access the member dashboard and all available resources.
                        </p>
                        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                            <p style="color: #155724; font-size: 14px; margin: 0;">
                                <strong>Status:</strong> Approved ✅<br>
                                Your account is now active and ready to use.
                            </p>
                        </div>
                        <div style="text-align: center; margin-bottom: 25px;">
                            <a href="${loginLink}" style="background-color: #28A8E0; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">Log In Now</a>
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
            `;
        } else {
            subject = 'NDSI Account Application Update';
            text = `Hello ${displayName},\n\nWe regret to inform you that your NDSI account application has not been approved at this time.${reason ? `\n\nReason: ${reason}` : ''}\n\nIf you believe this was an error or would like to provide additional information, please contact us.\n\nBest,\nThe NDSI Team`;
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ececec; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://ik.imagekit.io/3x197uc7r/NDSI/nds_logo.png" alt="NDSI Logo" style="width: 200px; height: auto;" />
                    </div>
                    <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #28A8E0; font-size: 24px; margin-bottom: 15px;">Hello ${displayName},</h2>
                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            We regret to inform you that your NDSI account application has not been approved at this time.
                        </p>
                        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                            <p style="color: #721c24; font-size: 14px; margin: 0;">
                                <strong>Status:</strong> Not Approved ❌<br>
                                ${reason ? `Reason: ${reason}` : 'No specific reason provided.'}
                            </p>
                        </div>
                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                            If you believe this was an error or would like to provide additional information, please contact us at ${process.env.EMAIL_USER}.
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
            `;
        }

        const mailOptions = {
            from: `"NDSI Team" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: subject,
            text: text,
            html: html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`${action} email sent successfully to ${user.email}`);
    } catch (error) {
        console.error(`Error sending ${action} email:`, error);
        throw error;
    }
} 