import { ResetPasswordFlow } from '@/app/auth/reset-password/ResetPasswordFlow';

const ResetPasswordPage = () => (
  <main className="mx-auto max-w-md px-4 py-12">
    <div className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Reset password</p>
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      <p className="text-sm text-gray-600">The team sent you a secure link — enter your new password below.</p>
    </div>
    <section className="mt-8">
      <ResetPasswordFlow />
    </section>
  </main>
);

export default ResetPasswordPage;
