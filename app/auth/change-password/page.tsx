import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ChangePasswordForm } from '@/app/auth/change-password/ChangePasswordForm';

// Server component that validates the active session before rendering the password form.
const ChangePasswordPage = async () => {
  const supabaseClient = await createSupabaseServerClient();

  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Change password
          </p>
          <h1 className="text-3xl font-bold">Session expired</h1>
          <p className="text-sm text-gray-600">
            Please sign in again before updating your credentials.
          </p>
          <Link href="/auth/login" className="text-blue-600 underline">
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Change password
        </p>
        <h1 className="text-3xl font-bold">Update your password</h1>
        <p className="text-sm text-gray-600">
          We are verifying your session before allowing a password change.
        </p>
      </div>
      <section className="mt-8">
        <ChangePasswordForm />
      </section>
    </main>
  );
};

export default ChangePasswordPage;
