// proxy.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export default async function proxy(req: NextRequest) {
  const res = NextResponse.next();

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

  const pathname = req.nextUrl.pathname;

  const isAuthRoute = pathname.startsWith('/auth');
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/analysis');

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
