import { ForgotPasswordForm } from '@/app/auth/forgot-password/ForgotPasswordForm';

const ForgotPasswordPage = () => (
  <main className="mx-auto max-w-md px-4 py-12">
    <div className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Forgot password</p>
      <h1 className="text-3xl font-bold">Reset your password</h1>
      <p className="text-sm text-gray-600">Enter your email and we will send you a secure link.</p>
    </div>
    <section className="mt-8">
      <ForgotPasswordForm />
    </section>
  </main>
);

export default ForgotPasswordPage;
