import '../styles/globals.css';
import type { ReactNode } from 'react';

import { Sidebar } from '@/components/navigation/Sidebar';

export const metadata = {
  title: 'Voicetracker UI',
  description: 'Interface de lecture seule pour les projections et alertes financières.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="main-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
