import { supabaseAdmin } from 'lib/supabase';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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
      .select('role')
      .eq('id', adminUser.id)
      .single();
    if (error || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
  } catch (error) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Validate input
  const { users } = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'Users array is required' });
  }

  // Define required fields (adjust as needed)
  const requiredFields = ['email', 'full_name', 'organization_name'];

  const results = [];
  // Hash the default password once and reuse
  let defaultHashedPassword = null;

  // Get default password from environment variable, fallback to 'ndsi123'
  const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'ndsi123';

  for (const user of users) {
    // Validate required fields
    const missing = requiredFields.filter((field) => !user[field]);
    if (missing.length > 0) {
      results.push({ email: user.email || null, success: false, error: `Missing fields: ${missing.join(', ')}` });
      continue;
    }
    // Check for existing user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .single();
    if (existingUser) {
      results.push({ email: user.email, success: false, error: 'User with this email already exists' });
      continue;
    }
    // Hash password if present, else use default
    let hashedPassword = null;
    if (user.password) {
      try {
        hashedPassword = await bcrypt.hash(user.password, 10);
      } catch (err) {
        results.push({ email: user.email, success: false, error: 'Failed to hash password' });
        continue;
      }
    } else {
      // Use default password from env
      if (!defaultHashedPassword) {
        defaultHashedPassword = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10);
      }
      hashedPassword = defaultHashedPassword;
    }
    // Determine approval status from import
    let isApproved = false;
    let approvalStatus = 'pending';
    if (user.status && typeof user.status === 'string' && user.status.trim().toLowerCase() === 'approved') {
      isApproved = true;
      approvalStatus = 'approved';
    }
    // Insert user
    try {
      const { data: inserted, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: user.email.toLowerCase(),
          password: hashedPassword,
          full_name: user.full_name,
          organization_name: user.organization_name,
          role_job_title: user.role_job_title,
          is_approved: isApproved,
          approval_status: approvalStatus,
          is_first_time: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        results.push({ email: user.email, success: false, error: error.message });
      } else {
        results.push({ email: user.email, success: true });
      }
    } catch (err) {
      results.push({ email: user.email, success: false, error: err.message });
    }
  }

  return res.status(200).json({ results });
} 