import React from 'react';
import type { AlertTextEntry } from '@/lib/types';
import { severityBadgeColor } from '@/lib/format';

export const AlertItem = ({ alert }: { alert: AlertTextEntry }) => {
  return (
    <article className="alert-item">
      <div
        className="alert-badge"
        style={{ backgroundColor: severityBadgeColor(alert.severity) }}
        aria-label={`Sévérité ${alert.severity.toLowerCase()}`}
      />
      <div className="alert-body">
        <div className="alert-headline">
          <h3>{alert.title}</h3>
          <span className="alert-priority">#{alert.priorityRank}</span>
        </div>
        <p>{alert.message}</p>
      </div>
    </article>
  );
};
