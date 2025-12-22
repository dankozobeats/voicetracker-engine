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
        <p>Affichage des budgets tels que livrés par l'engine.</p>
      </section>

      <div className="analysis-grid">
        <div id="category">
          <CategoryBudgetsPanel budgets={mockedEnginePayload.categoryBudgets} />
        </div>
        <div id="rolling">
          <RollingBudgetsPanel budgets={mockedEnginePayload.rollingBudgets} />
        </div>
        <div id="multi-month">
          <MultiMonthBudgetsPanel budgets={mockedEnginePayload.multiMonthBudgets} />
        </div>
        <div id="trends">
          <BudgetTrendsPanel trends={mockedEnginePayload.trends} />
        </div>
      </div>
    </main>
  );
}