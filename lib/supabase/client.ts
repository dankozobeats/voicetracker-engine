'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required on the client');
}

/**
 * Browser-side Supabase client
 * - Used only inside client components/forms in `/app/auth/*`
 * - Relies on the public anon key so no secrets leak
 * - Shares cookies/session data automatically with Supabase
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
