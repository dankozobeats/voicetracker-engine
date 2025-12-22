import { ConfirmFlow } from '@/app/auth/confirm/ConfirmFlow';

const ConfirmPage = () => {
  // Keep this as a server component so the route is fast and has no client state.
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">Email confirmation</p>
        <h1 className="text-3xl font-bold">Confirming your email</h1>
        <p className="text-sm text-gray-600">We are validating the token that was sent to you.</p>
      </div>
      <section className="mt-8">
        <ConfirmFlow />
      </section>
    </main>
  );
};

export default ConfirmPage;
