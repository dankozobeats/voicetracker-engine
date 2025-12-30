import { Suspense } from 'react';
import Link from 'next/link';
import LoginClient from './LoginClient';

const LoginPage = () => {
  // Server-rendered shell (fast, SEO-safe)
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
          Sign in
        </p>
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-sm text-gray-600">
          Use your registered email and password to access the dashboard.
        </p>
      </div>

      <section className="mt-8">
        <Suspense fallback={<div />}>
          <LoginClient />
        </Suspense>
      </section>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
