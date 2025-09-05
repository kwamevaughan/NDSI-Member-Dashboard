import { supabaseAdmin } from 'lib/supabase';

export default async function handler(req, res) {
  // Disallow caching to ensure the request always reaches the server
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const startedAt = Date.now();
  try {
    // Perform a minimal, fast query to keep Supabase warm
    // Using the small 'settings' table if present; falls back gracefully
    let meta = { queried: false };
    try {
      const { error } = await supabaseAdmin
        .from('settings')
        .select('id')
        .limit(1);
      if (!error) meta.queried = true;
    } catch {}

    const latencyMs = Date.now() - startedAt;
    return res.status(200).json({ status: 'ok', supabaseQueried: meta.queried, latencyMs });
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    return res.status(200).json({ status: 'ok', supabaseQueried: false, latencyMs });
  }
} 