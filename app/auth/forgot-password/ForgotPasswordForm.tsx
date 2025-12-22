'use client';

import { FormEvent, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase/client';

const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!publicAppUrl) {
  throw new Error('NEXT_PUBLIC_APP_URL is required for the password reset flow');
}

// Browser-only because we call Supabase directly for the reset flow and must show immediate UI feedback.
export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${publicAppUrl.replace(/\/$/, '')}/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage('Check your inbox for instructions to reset your password.');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {isPending ? 'Sending reset email…' : 'Send reset link'}
      </button>
    </form>
  );
};
