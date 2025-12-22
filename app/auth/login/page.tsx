import { LoginForm } from '@/app/auth/login/LoginForm';

const LoginPage = () => {
  // This layout stays server-rendered so the route remains fast and public.
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">Sign in</p>
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-sm text-gray-600">Use your registered email and password to access the dashboard.</p>
      </div>
      <section className="mt-8">
        <LoginForm />
      </section>
    </main>
  );
};

export default LoginPage;
