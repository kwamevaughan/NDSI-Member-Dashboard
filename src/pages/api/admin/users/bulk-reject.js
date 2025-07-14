import { supabaseAdmin } from 'lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const token = authHeader.replace('Bearer ', '');
  let adminUser;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    adminUser = decoded;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Verify admin status
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', adminUser.id)
      .single();
    if (error || !user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
  } catch (error) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Validate input
  const { userIds, reason } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds array is required' });
  }
  if (!reason || typeof reason !== 'string') {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  try {
    // Batch processing
    const BATCH_SIZE = 100;
    let updated = [];
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batchIds = userIds.slice(i, i + BATCH_SIZE);
      const { data: batchUpdated, error } = await supabaseAdmin
        .from('users')
        .update({
          is_approved: false,
          approval_status: 'rejected',
          approved_by: adminUser.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .in('id', batchIds)
        .select();
      if (error) {
        throw error;
      }
      if (batchUpdated) updated = updated.concat(batchUpdated);
    }

    // Check notification settings
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('notify_on_reject')
      .eq('id', 1)
      .single();

    // Send notification emails if enabled
    if (settings?.notify_on_reject && updated && updated.length > 0) {
      try {
        const { sendApprovalEmail } = await import('../../../../utils/emailService');
        for (const user of updated) {
          await sendApprovalEmail(user, 'reject', reason);
        }
      } catch (emailError) {
        console.error('Error sending rejection emails:', emailError);
        // Don't fail the operation if email fails
      }
    }

    return res.status(200).json({
      message: `Rejected ${updated.length} user(s) successfully`,
      updatedCount: updated.length,
    });
  } catch (error) {
    console.error('Bulk reject error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 