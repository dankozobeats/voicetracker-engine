import React from 'react';
import type { RollingCategoryBudgetResult } from '@/lib/types';
import { RollingBudgetItem } from './RollingBudgetItem';

export const RollingBudgetsPanel = ({ budgets }: { budgets: RollingCategoryBudgetResult[] }) => {
  return (
    <section className="budgets-panel" aria-label="Budgets glissants">
      <header className="panel-header">
        <p className="eyebrow">Budgets glissants</p>
        <h2>Rolling budgets</h2>
      </header>

      <div className="budget-list">
        {budgets.map((budget) => (
          <RollingBudgetItem key={`${budget.category}-${budget.windowMonths}`} budget={budget} />
        ))}
      </div>
    </section>
  );
};
