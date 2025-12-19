import React from 'react';

import { CategoryBudgetsPanel } from '@/components/budgets/CategoryBudgetsPanel';
import { RollingBudgetsPanel } from '@/components/budgets/RollingBudgetsPanel';
import { MultiMonthBudgetsPanel } from '@/components/budgets/MultiMonthBudgetsPanel';
import { BudgetTrendsPanel } from '@/components/budgets/BudgetTrendsPanel';
import { mockedEnginePayload } from '@/lib/api';

export default function BudgetsPage() {
  return (
    <main className="page-shell">
      <section className="overview-card">
        <p className="eyebrow">Vue budgets</p>
        <h1>Budgets contractuels</h1>
        <p>Affichage des budgets tels que livrés par l’engine.</p>
      </section>

      <div className="analysis-grid">
        <CategoryBudgetsPanel budgets={mockedEnginePayload.categoryBudgets} />
        <RollingBudgetsPanel budgets={mockedEnginePayload.rollingBudgets} />
        <MultiMonthBudgetsPanel budgets={mockedEnginePayload.multiMonthBudgets} />
        <BudgetTrendsPanel trends={mockedEnginePayload.trends} />
      </div>
    </main>
  );
}
