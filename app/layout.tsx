import './globals.css';
import '../styles/globals.css';  // ← AJOUTE CETTE LIGNE
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';

export const metadata = {
  title: 'Voicetracker UI',
  description: 'Interface de lecture seule pour les projections et alertes financières.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Sidebar />
        <main className="min-h-screen pt-16 lg:pt-0 lg:pl-64">{children}</main>
      </body>
    </html>
  );
}
