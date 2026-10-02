import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
const serviceRoleKey = rawKey.trim().replace(/^["']|["']$/g, '');

/**
 * Server-only Supabase client initialized with the privileged Service Role Key.
 * MUST ONLY be imported and called inside server routes protected by verifySessionToken().
 * Automatically bypasses Supabase Row-Level Security (RLS).
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

