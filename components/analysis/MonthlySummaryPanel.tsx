import React from 'react';
import type { MonthlySummaryOutput } from '@/lib/types';

export const MonthlySummaryPanel = ({ summary }: { summary: MonthlySummaryOutput }) => {
  return (
    <section className="analysis-panel" aria-label={`Résumé mensuel ${summary.month}`}>
      <header className="panel-header">
        <p className="eyebrow">Analyse mensuelle</p>
        <h2>{summary.title}</h2>
      </header>

      <div className="analysis-section">
        <p className="analysis-section-label">Points clés</p>
        <ul aria-label="Points clés">
          {summary.highlights.map((point, index) => (
            <li key={`${point}-${index}`}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="analysis-section">
        <p className="analysis-section-label">Détails</p>
        <ul aria-label="Détails">
          {summary.details.map((detail, index) => (
            <li key={`${detail}-${index}`}>{detail}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};
