import React from 'react';
import type { CategoryBudgetResult } from '@/lib/types';
import CategoryBudgetItem from './CategoryBudgetItem';

export const CategoryBudgetsPanel = ({ budgets }: { budgets: CategoryBudgetResult[] }) => {
  return (
    <section className="budgets-panel" aria-label="Budgets par catégorie">
      <header className="panel-header">
        <p className="eyebrow">Budgets</p>
        <h2>Par catégorie</h2>
      </header>

      <div className="budget-list">
        {budgets.map((budget) => (
          <CategoryBudgetItem key={budget.category} budgetResult={budget} />
        ))}
      </div>
    </section>
  );
};
