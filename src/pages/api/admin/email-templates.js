import { supabaseAdmin } from 'lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin authentication for PUT
  if (req.method === 'PUT') {
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
        .select('role')
        .eq('id', adminUser.id)
        .single();
      if (error || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    } catch (error) {
      return res.status(403).json({ error: 'Admin access required' });
    }
  }

  if (req.method === 'GET') {
    // Get all templates
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('key, subject, body_html, body_text');
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }
    return res.status(200).json({ templates: data });
  }

  if (req.method === 'PUT') {
    // Update a template by key
    const { key, subject, body_html, body_text } = req.body;
    if (!key || !subject || !body_html || !body_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .update({ subject, body_html, body_text })
      .eq('key', key)
      .select()
      .single();
    if (error) {
      return res.status(500).json({ error: 'Failed to update template' });
    }
    return res.status(200).json({ template: data });
  }
} 