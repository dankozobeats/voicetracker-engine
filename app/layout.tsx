import './globals.css';
import '../styles/globals.css';  // ← AJOUTE CETTE LIGNE
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import QueryProvider from '@/components/providers/QueryProvider';
import { CalculatorWrapper } from '@/components/shared/CalculatorWrapper';

export const metadata = {
  title: 'Voicetracker UI',
  description: 'Interface de lecture seule pour les projections et alertes financières.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <QueryProvider>
          <Sidebar />
          <main className="min-h-screen pt-16 lg:pt-0 lg:pl-64">{children}</main>
          <CalculatorWrapper />
        </QueryProvider>
      </body>
    </html>
  );
}
