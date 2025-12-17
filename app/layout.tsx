import '../styles/globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Voicetracker UI',
  description: 'Interface de lecture seule pour les projections et alertes financières.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
