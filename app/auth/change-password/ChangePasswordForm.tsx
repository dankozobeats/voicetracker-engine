'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// Built as a client component because it relies on the current browser session
// in order to securely call Supabase updateUser without reloading the page.
export const ChangePasswordForm = () => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords must match.');
      return;
    }

    startTransition(async () => {
      setStatus('saving');
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setStatus('idle');
        return;
      }

      router.replace('/overview');
    });
  };

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
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Confirm password</span>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending || status === 'saving'}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {status === 'saving' || isPending ? 'Updating password…' : 'Change password'}
      </button>
    </form>
  );
};
