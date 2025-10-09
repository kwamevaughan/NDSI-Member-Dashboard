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
    try {
      const adminUser = jwt.verify(req.headers.authorization.replace('Bearer ', ''), process.env.JWT_SECRET);
      
      // Get global settings (where user_id is NULL)
      const { data: globalSettings, error: globalError } = await supabaseAdmin
        .from('settings')
        .select('*')
        .is('user_id', null)
        .single();

      if (globalError && globalError.code !== 'PGRST116') { // PGRST116 = no rows
        throw globalError;
      }

      // Get user-specific settings if they exist
      const { data: userSettings, error: userError } = await supabaseAdmin
        .from('settings')
        .select('*')
        .eq('user_id', adminUser.id)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows
        throw userError;
      }

      // Merge settings (user-specific override global)
      const settings = {
        // Global defaults
        notify_on_approve: true,
        notify_on_reject: true,
        notify_on_delete: true,
        notify_on_registration: true,
        // Apply global settings if they exist
        ...(globalSettings || {}),
        // Apply user settings if they exist (overriding globals)
        ...(userSettings || {})
      };

      // Remove internal fields
      delete settings.id;
      delete settings.user_id;
      delete settings.created_at;
      delete settings.updated_at;

      return res.status(200).json({ settings });
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch settings',
        details: error.message 
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const adminUser = jwt.verify(req.headers.authorization.replace('Bearer ', ''), process.env.JWT_SECRET);
      const { notify_on_approve, notify_on_reject, notify_on_delete, notify_on_registration } = req.body;
      
      // Check if user exists in the users table
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', adminUser.id)
        .single();

      // If user doesn't exist, return an error
      if (userError || !user) {
        return res.status(404).json({ 
          error: 'User not found',
          details: 'Please ensure you have a valid user account before updating settings'
        });
      }
      
      // Only include fields that are provided and are boolean
      const updateFields = {};
      if (typeof notify_on_approve === 'boolean') updateFields.notify_on_approve = notify_on_approve;
      if (typeof notify_on_reject === 'boolean') updateFields.notify_on_reject = notify_on_reject;
      if (typeof notify_on_delete === 'boolean') updateFields.notify_on_delete = notify_on_delete;
      if (typeof notify_on_registration === 'boolean') updateFields.notify_on_registration = notify_on_registration;
      
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // Check if user already has settings
      const { data: existingSettings, error: fetchError } = await supabaseAdmin
        .from('settings')
        .select('id')
        .eq('user_id', adminUser.id)
        .maybeSingle();

      let data, error;
      
      if (existingSettings) {
        // Update existing user settings
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('settings')
          .update({
            ...updateFields,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select()
          .single();
        
        data = updateData;
        error = updateError;
      } else {
        // Create new user settings with provided values and global defaults for others
        const { data: globalSettings } = await supabaseAdmin
          .from('settings')
          .select('*')
          .is('user_id', null)
          .single();

        const newSettings = {
          ...(globalSettings || {}), // Global defaults
          ...updateFields,           // User overrides
          user_id: adminUser.id,     // Set user ID
          id: undefined,             // Remove ID to avoid conflicts
          created_at: undefined,     // Let database set these
          updated_at: undefined
        };

        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('settings')
          .insert(newSettings)
          .select()
          .single();
        
        data = insertData;
        error = insertError;
      }

      if (error) throw error;

      // Return the updated settings (will be merged with globals on next GET)
      const responseData = {
        notify_on_approve: data.notify_on_approve,
        notify_on_reject: data.notify_on_reject,
        notify_on_delete: data.notify_on_delete,
        notify_on_registration: data.notify_on_registration
      };

      return res.status(200).json({ 
        settings: responseData,
        message: 'Settings saved successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return res.status(500).json({ 
        error: 'Failed to update settings',
        details: error.message 
      });
    }
    return res.status(200).json({ settings: data });
  }
} 