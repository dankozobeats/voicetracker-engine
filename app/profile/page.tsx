import { Suspense } from 'react';
import ProfileClient from './ProfileClient';

export default function ProfilePage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Mon Profil</h1>
        <p className="text-gray-600">
          Gérez vos informations personnelles et paramètres de compte
        </p>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <ProfileClient />
      </Suspense>
    </main>
  );
}
