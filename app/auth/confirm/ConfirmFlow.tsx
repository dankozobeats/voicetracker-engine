'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface ConfirmFlowProps {
  accessToken: string | null;
  refreshToken: string | null;
}

// Client component: completes Supabase email confirmation using tokens
// passed from ConfirmClient (which owns useSearchParams).
const ConfirmFlow = ({ accessToken, refreshToken }: ConfirmFlowProps) => {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Verifying your email…');

  useEffect(() => {
    const completeConfirmation = async () => {
      setStatus('loading');

      if (!accessToken || !refreshToken) {
        setStatus('error');
        setMessage('Missing authentication tokens in the confirmation link.');
        return;
      }

      // Supabase v2: manually set session from URL tokens
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
  }, [accessToken, refreshToken, router]);

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

export default ConfirmFlow;
