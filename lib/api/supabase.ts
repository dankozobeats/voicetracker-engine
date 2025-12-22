// lib/api/supabase.ts
import { createClient } from "@supabase/supabase-js";


console.log('[SUPABASE ENV CHECK]', {
  url: process.env.SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase env vars missing: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

/**
 * Supabase client for SERVER-SIDE ONLY usage (API routes)
 * Never import this file in client components.
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
