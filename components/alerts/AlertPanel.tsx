import React from 'react';
import type { AlertTextEntry } from '@/lib/types';
import { AlertItem } from './AlertItem';

interface AlertPanelProps {
  alertTexts: AlertTextEntry[];
}

export const AlertPanel = ({ alertTexts }: AlertPanelProps) => {
  return (
    <section className="alert-panel" aria-label="Liste des alertes avancées">
      <header className="panel-header">
        <p className="eyebrow">Alertes avancées</p>
        <h2>Alert Text</h2>
        <p className="panel-subtitle">Ordre inchangé, directement issu du consumer.</p>
      </header>
      <div className="alert-list">
        {alertTexts.map((entry) => (
          <AlertItem key={`${entry.groupId}-${entry.priorityRank}`} alert={entry} />
        ))}
      </div>
    </section>
  );
};
