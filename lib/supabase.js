// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Client-side instance (uses anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase URL or Anon Key in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side instance (uses service key) - only available on server-side
let supabaseAdmin = null;

// Check if we're on the server-side
if (typeof window === 'undefined') {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseServiceKey) {
        console.error("Missing Supabase Service Key in environment variables.");
    } else {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    }
}

export { supabaseAdmin };