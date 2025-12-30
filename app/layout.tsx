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
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pt-16 lg:pt-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
