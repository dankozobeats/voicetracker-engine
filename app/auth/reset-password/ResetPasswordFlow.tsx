'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface ResetPasswordFlowProps {
  accessToken: string | null;
  refreshToken: string | null;
}

const ResetPasswordFlow = ({
  accessToken,
  refreshToken,
}: ResetPasswordFlowProps) => {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('Preparing password reset…');

  useEffect(() => {
    const prepareSession = async () => {
      setStatus('loading');

      if (!accessToken || !refreshToken) {
        setStatus('error');
        setMessage('Missing reset tokens in the URL.');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Unable to initialize password reset.');
        return;
      }

      router.replace('/auth/change-password');
    };

    prepareSession();
  }, [accessToken, refreshToken, router]);

  return (
    <div className="space-y-4" aria-live="polite">
      <p className="text-sm text-gray-600">{message}</p>

      {status === 'error' && (
        <p className="text-sm text-red-600">
          This password reset link is invalid or expired.
        </p>
      )}
    </div>
  );
};

export default ResetPasswordFlow;
