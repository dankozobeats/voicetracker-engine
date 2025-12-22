'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// Client component because Supabase confirmation relies on URL tokens only available inside the browser.

export const ConfirmFlow = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Verifying your email…');

  useEffect(() => {
    const completeConfirmation = async () => {
      setStatus('loading');

      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        setStatus('error');
        setMessage('Missing authentication tokens in the confirmation link.');
        return;
      }

      // Supabase v2 requires manual session extraction from URL
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Unable to confirm the email link.');
        return;
      }

      setStatus('success');
      router.replace('/dashboard');
    };

    completeConfirmation();
  }, [router, searchParams]);

  return (
    <div className="space-y-4" aria-live="polite">
      <p className="text-sm text-gray-600">{message}</p>
      {status === 'error' && (
        <p className="text-sm text-red-600">
          The confirmation link is invalid or expired. Please request a new one or try signing in manually.
        </p>
      )}
    </div>
  );
};
