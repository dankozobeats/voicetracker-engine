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
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    get(name: string) {
      // Only access document in browser
      if (typeof document === 'undefined') return undefined;

      // Get cookie from document.cookie
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    },
    set(name: string, value: string, options: any) {
      // Only access document in browser
      if (typeof document === 'undefined') return;

      // Set cookie via document.cookie
      let cookie = `${name}=${value}`;
      if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
      if (options?.path) cookie += `; path=${options.path}`;
      if (options?.domain) cookie += `; domain=${options.domain}`;
      if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
      if (options?.secure) cookie += '; secure';
      document.cookie = cookie;
    },
    remove(name: string, options: any) {
      // Only access document in browser
      if (typeof document === 'undefined') return;

      // Remove cookie by setting max-age to 0
      let cookie = `${name}=; max-age=0`;
      if (options?.path) cookie += `; path=${options.path}`;
      if (options?.domain) cookie += `; domain=${options.domain}`;
      document.cookie = cookie;
    },
  },
});
