// proxy.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export default async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // ============================================
  // SECURITY HEADERS
  // ============================================
  // Prevent clickjacking attacks
  res.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://*.supabase.co;
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  res.headers.set('Content-Security-Policy', cspHeader);

  // Permissions Policy - Disable unnecessary browser features
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Strict Transport Security (HSTS) - Only in production
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Additional headers for API routes
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith('/api/')) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach((cookie) => {
            res.cookies.set(cookie);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = pathname.startsWith('/auth');
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/analysis') ||
    pathname.startsWith('/overview') ||
    pathname.startsWith('/projection') ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/budgets') ||
    pathname.startsWith('/debts') ||
    pathname.startsWith('/recurring-charges') ||
    pathname.startsWith('/ceiling-rules') ||
    pathname.startsWith('/account-balances') ||
    pathname.startsWith('/import-checklist') ||
    pathname.startsWith('/alerts');

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/overview', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
