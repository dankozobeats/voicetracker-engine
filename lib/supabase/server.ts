import { cookies } from 'next/headers';
import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const serverUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!serverUrl || !serviceRoleKey || !anonKey) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY must be defined on the server');
}

// Server-only Supabase admin client (service role, bypasses RLS)
export const serverSupabaseAdmin = () => createClient(serverUrl, serviceRoleKey);

/**
 * Adapter between Next.js cookies() API (async in Next 16)
 * and Supabase SSR cookie interface.
 */
const adaptNextCookies = async () => {
  const cookieStore = await cookies();

  return {
    getAll: () =>
      cookieStore.getAll().map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
      })),

    setAll: (entries: Parameters<SetAllCookies>[0]) => {
      entries.forEach(({ name, value, options }) => {
        cookieStore.set({
          name,
          value,
          ...options,
        });
      });
    },
  };
};

/**
 * Supabase server client with cookie support (App Router / SSR).
 * Uses ANON_KEY for authentication checks (respects RLS).
 * Must be async because cookies() is async.
 */
export const createSupabaseServerClient = async () =>
  createServerClient(serverUrl, anonKey, {
    cookies: await adaptNextCookies(),
  });
