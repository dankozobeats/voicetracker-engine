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
      <MonthlySummaryPanel summary={mockedMonthlySummary} />
      <AlertPanel alertTexts={mockedEnginePayload.alertTexts} />
      <div className="analysis-grid">
        <CategoryBudgetsPanel budgets={mockedEnginePayload.categoryBudgets} />
        <RollingBudgetsPanel budgets={mockedEnginePayload.rollingBudgets} />
        <MultiMonthBudgetsPanel budgets={mockedEnginePayload.multiMonthBudgets} />
        <BudgetTrendsPanel trends={mockedEnginePayload.trends} />
      </div>
    </main>
  );
}
