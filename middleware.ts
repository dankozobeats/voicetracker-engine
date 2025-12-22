import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!, // ✅ ANON KEY ONLY
    {
      cookies: {
        getAll: () =>
          req.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          })),

        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    },
  );

  // 🔑 Triggers session refresh if needed
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  const isAuthPage = pathname.startsWith('/auth');

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/analysis') ||
    pathname.startsWith('/budgets') ||
    pathname.startsWith('/alerts');

  if (!session && isProtected) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
