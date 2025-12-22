'use client';

import { FormEvent, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase/client';

const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!publicAppUrl) {
  throw new Error('NEXT_PUBLIC_APP_URL is required for the registration flow');
}

// Client-side because the form directly calls the browser Supabase client without needing server rendering.
export const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${publicAppUrl.replace(/\/$/, '')}/auth/confirm`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccessMessage('A confirmation link was sent to your inbox.');
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
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Password</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {isPending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
};
