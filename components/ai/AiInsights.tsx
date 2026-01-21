import React from 'react';
import type { AiInsight } from '@/lib/ai/ai.types';

interface AiInsightsProps {
  analysis?: string;
  insights: AiInsight[];
}

export const AiInsights = ({ analysis, insights }: AiInsightsProps) => {
  return (
    <section className="analysis-panel" aria-label="Analyse IA">
      <header className="panel-header">
        <p className="eyebrow">Analyse IA</p>
        <h2>Insights</h2>
      </header>

      {analysis ? (
        <div className="analysis-section">
          <p className="analysis-section-label">Analyse</p>
          <p className="analysis-note">{analysis}</p>
        </div>
      ) : null}

      <div className="analysis-section">
        <p className="analysis-section-label">Insights</p>
        {insights.length === 0 ? (
          <p className="analysis-note">Aucun insight disponible.</p>
        ) : (
          <ul aria-label="Insights">
            {insights.map((insight, index) => (
              <li key={`${insight.title}-${index}`}>
                <strong>{insight.title}</strong> — {insight.detail}
                {insight.evidence && insight.evidence.length > 0 ? (
                  <div className="analysis-note">
                    Preuves: {insight.evidence.join(', ')}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
