import { RegisterForm } from '@/app/auth/register/RegisterForm';

const RegisterPage = () => {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Register</p>
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-sm text-gray-600">We will send a confirmation email before you can sign in.</p>
      </div>
      <section className="mt-8">
        <RegisterForm />
      </section>
    </main>
  );
};

export default RegisterPage;
