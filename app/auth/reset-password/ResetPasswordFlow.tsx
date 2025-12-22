'use client';

import { FormEvent, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// Client-only because we must read the URL token inside the browser and then
// prompt the user to pick a new password without rebuilding the page.
export const ResetPasswordFlow = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const confirmToken = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        setError('Invalid or expired link.');
        setSessionChecked(true);
        return;
      }

      // Supabase v2 requires manual session extraction from URL
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError(sessionError.message);
        setSessionChecked(true);
        return;
      }

      setSessionChecked(true);
    };

    confirmToken();
  }, [searchParams]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      setStatus('saving');
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setStatus('idle');
        return;
      }

      setStatus('success');
      router.replace('/auth/login');
    });
  };

  if (!sessionChecked) {
    return <p className="text-sm text-gray-600">Validating reset token…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">New password</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={isPending || status === 'saving'}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {status === 'saving' || isPending ? 'Saving new password…' : 'Save password'}
      </button>
    </form>
  );
};
