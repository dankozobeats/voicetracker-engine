import React from 'react';

import { AlertPanel } from '@/components/alerts/AlertPanel';
import { CategoryBudgetsPanel } from '@/components/budgets/CategoryBudgetsPanel';
import { RollingBudgetsPanel } from '@/components/budgets/RollingBudgetsPanel';
import { MultiMonthBudgetsPanel } from '@/components/budgets/MultiMonthBudgetsPanel';
import { BudgetTrendsPanel } from '@/components/budgets/BudgetTrendsPanel';
import { MonthlySummaryPanel } from '@/components/analysis/MonthlySummaryPanel';
import { mockedEnginePayload, mockedMonthlySummary } from '@/lib/api';

export default function AnalysisPage() {
  return (
    <main className="page-shell analysis-shell">
      <div className="analysis-header">
        <h1>Analyse mensuelle</h1>
        <p className="analysis-note">
          Ces indicateurs sont entièrement analytiques : chaque texte, statut, ratio et priorité provient du
          moteur et des consumers verrouillés.
        </p>
      </div>

      <MonthlySummaryPanel summary={mockedMonthlySummary} />

      <section className="analysis-section-group">
        <p className="analysis-section-heading">Alertes avancées</p>
        <AlertPanel alertTexts={mockedEnginePayload.alertTexts} />
      </section>

      <section className="analysis-section-group">
        <p className="analysis-section-heading">Budgets & tendances</p>
        <div className="analysis-grid">
          <CategoryBudgetsPanel budgets={mockedEnginePayload.categoryBudgets} />
          <RollingBudgetsPanel budgets={mockedEnginePayload.rollingBudgets} />
          <MultiMonthBudgetsPanel budgets={mockedEnginePayload.multiMonthBudgets} />
          <BudgetTrendsPanel trends={mockedEnginePayload.trends} />
        </div>
      </section>
    </main>
  );
}
