import { cookies } from 'next/headers';
import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const serverUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serverUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined on the server');
}

// Server-only Supabase client for API routes that must keep the service role key confidential.
// Server-only Supabase client factory so API routes can safely use the service role key without leaking it.
export const serverSupabase = () => createClient(serverUrl, serviceRoleKey);

const adaptNextCookies = () => {
  const cookieStore = cookies();

  return {
    getAll: () =>
      cookieStore.getAll().map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
      })),
    setAll: (entries: Parameters<SetAllCookies>[0]) => {
      entries.forEach(({ name, value, options }) => {
        cookieStore.set({ name, value, ...options });
      });
    },
  };
};

export const createSupabaseServerClient = () =>
  createServerClient(serverUrl, serviceRoleKey, {
    cookies: adaptNextCookies(),
  });
