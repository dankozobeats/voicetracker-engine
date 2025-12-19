import React from 'react';
import type { CategoryBudgetResult } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

const STATUS_STYLES: Record<CategoryBudgetResult['status'], string> = {
  OK: '#16a34a',
  WARNING: '#b45309',
  EXCEEDED: '#b91c1c',
};

export const CategoryBudgetItem = ({ budgetResult }: { budgetResult: CategoryBudgetResult }) => {
  const accentColor = STATUS_STYLES[budgetResult.status];
  const badgeStyle = { ['--badge-color' as string]: accentColor } as React.CSSProperties;

  return (
    <article className="budget-item">
      <header className="budget-item__header">
        <h3>{budgetResult.category}</h3>
        <span className="budget-status" style={badgeStyle}>
          {budgetResult.status}
        </span>
      </header>

      <dl className="budget-metrics">
        <div>
          <dt>Dépensé</dt>
          <dd>{formatCurrency(budgetResult.spent)}</dd>
        </div>
        <div>
          <dt>Budget</dt>
          <dd>{formatCurrency(budgetResult.budget)}</dd>
        </div>
        <div>
          <dt>Ratio</dt>
          <dd>{`${budgetResult.ratio}%`}</dd>
        </div>
      </dl>
    </article>
  );
};
