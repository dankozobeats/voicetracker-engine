import React from 'react';

import { AlertPanel } from '@/components/alerts/AlertPanel';
import { mockedEnginePayload } from '@/lib/api';

export default function AlertsPage() {
  return (
    <main className="page-shell">
      <section className="overview-card">
        <p className="eyebrow">Alertes avancées</p>
        <h1>Alertes contractuelles</h1>
        <p>Toutes les alertes proviennent du consumer alert-text, ordre conservé.</p>
      </section>

      <AlertPanel alertTexts={mockedEnginePayload.alertTexts} />
    </main>
  );
}
