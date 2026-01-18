import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const typeParam = searchParams.get('type');
  const type = typeParam as EmailOtpType | null;

  const redirectTo = new URL('/auth/welcome', origin);

  if (!tokenHash || !type) {
    redirectTo.pathname = '/auth/sign-in';
    redirectTo.searchParams.set('error', 'invalid_link');
    return NextResponse.redirect(redirectTo);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      redirectTo.pathname = '/auth/sign-in';
      redirectTo.searchParams.set('error', 'expired_or_invalid');
      return NextResponse.redirect(redirectTo);
    }

    return NextResponse.redirect(redirectTo);
  } catch (err: unknown) {
    console.error('[auth][confirm][FATAL]', err);
    redirectTo.pathname = '/auth/sign-in';
    redirectTo.searchParams.set('error', 'internal_error');
    return NextResponse.redirect(redirectTo);
  }
}
