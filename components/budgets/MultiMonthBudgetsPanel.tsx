import React from 'react';
import type { MultiMonthBudgetResult } from '@/lib/types';
import { MultiMonthBudgetItem } from './MultiMonthBudgetItem';

export const MultiMonthBudgetsPanel = ({ budgets }: { budgets: MultiMonthBudgetResult[] }) => {
  return (
    <section className="budgets-panel" aria-label="Budgets multi-mois">
      <header className="panel-header">
        <p className="eyebrow">Budgets multi-mois</p>
        <h2>Multi-month budgets</h2>
      </header>

      <div className="budget-list">
        {budgets.map((budget) => (
          <MultiMonthBudgetItem key={`${budget.category}-${budget.periodStart}`} budget={budget} />
        ))}
      </div>
    </section>
  );
};
