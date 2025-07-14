import { supabaseAdmin } from 'lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Only allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin authentication for POST
  if (req.method === 'POST') {
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
  }

  if (req.method === 'GET') {
    // Get settings (single row, id=1)
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('notify_on_approve, notify_on_reject, notify_on_delete')
      .eq('id', 1)
      .single();
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
    return res.status(200).json({ settings: data });
  }

  if (req.method === 'POST') {
    // Update settings (single row, id=1)
    const { notify_on_approve, notify_on_reject, notify_on_delete } = req.body;
    const updateFields = {};
    if (typeof notify_on_approve === 'boolean') updateFields.notify_on_approve = notify_on_approve;
    if (typeof notify_on_reject === 'boolean') updateFields.notify_on_reject = notify_on_reject;
    if (typeof notify_on_delete === 'boolean') updateFields.notify_on_delete = notify_on_delete;
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    const { data, error } = await supabaseAdmin
      .from('settings')
      .update(updateFields)
      .eq('id', 1)
      .select()
      .single();
    if (error) {
      return res.status(500).json({ error: 'Failed to update settings' });
    }
    return res.status(200).json({ settings: data });
  }
} 