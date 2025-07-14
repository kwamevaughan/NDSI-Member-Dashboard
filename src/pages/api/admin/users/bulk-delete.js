// src/pages/api/admin/users/bulk-delete.js
import { supabaseAdmin } from 'lib/supabase';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify admin token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.is_admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'User IDs array is required' });
        }

        // Get user details before deletion for email notifications
        const { data: usersToDelete, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, is_admin')
            .in('id', userIds);

        if (fetchError) {
            console.error('Error fetching users:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        // Prevent deletion of admin users
        const adminUsers = usersToDelete.filter(user => user.is_admin);
        if (adminUsers.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete admin users. Please contact a super administrator.',
                adminEmails: adminUsers.map(u => u.email)
            });
        }

        // Prevent admin from deleting themselves
        if (userIds.includes(decoded.id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Delete users
        const { error: deleteError } = await supabaseAdmin
            .from('users')
            .delete()
            .in('id', userIds);

        if (deleteError) {
            console.error('Error deleting users:', deleteError);
            return res.status(500).json({ error: 'Failed to delete users' });
        }

        // Send deletion notification emails asynchronously
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

                for (const user of usersToDelete) {
                    const mailOptions = {
                        from: `"NDSI Team" <${process.env.EMAIL_USER}>`,
                        to: user.email,
                        subject: 'NDSI Account Deletion Notice',
                        text: `Hello ${user.full_name || 'User'},\n\nYour NDSI account has been permanently deleted by an administrator. If you believe this was done in error, please contact us immediately.\n\nBest regards,\nThe NDSI Team`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ececec; border-radius: 8px;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <img src="https://ik.imagekit.io/3x197uc7r/NDSI/nds_logo.png" alt="NDSI Logo" style="width: 200px; height: auto;" />
                                </div>
                                <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <h2 style="color: #dc2626; font-size: 24px; margin-bottom: 15px;">Account Deletion Notice</h2>
                                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                        Hello ${user.full_name || 'User'},
                                    </p>
                                    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                                        <p style="color: #dc2626; font-size: 14px; margin: 0;">
                                            <strong>Important:</strong> Your NDSI account has been permanently deleted by an administrator.
                                        </p>
                                    </div>
                                    <p style="color: #666666; font-size: 14px; line-height: 1.5;">
                                        If you believe this was done in error, please contact us immediately at ${process.env.EMAIL_USER}.
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
                }
                console.log('Deletion notification emails sent successfully');
            } catch (emailError) {
                console.error('Deletion notification email error:', emailError);
            }
        })();

        return res.status(200).json({ 
            message: `Successfully deleted ${userIds.length} user${userIds.length !== 1 ? 's' : ''}`,
            deletedCount: userIds.length
        });

    } catch (error) {
        console.error('Bulk delete error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
} 