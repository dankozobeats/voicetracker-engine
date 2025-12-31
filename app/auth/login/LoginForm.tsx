'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface LoginFormProps {
  redirect?: string | null;
}

const LoginForm = ({ redirect }: LoginFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Refresh the router to sync server-side session
      router.refresh();

      const safeRedirect =
        redirect && redirect.startsWith('/') ? redirect : '/overview';

      router.replace(safeRedirect);
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {isPending ? 'Signing you in…' : 'Sign in'}
      </button>
    </form>
  );
};

export default LoginForm;
