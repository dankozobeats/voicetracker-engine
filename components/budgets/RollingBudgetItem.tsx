import React from 'react';
import type { RollingCategoryBudgetResult } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

const STATUS_STYLES: Record<RollingCategoryBudgetResult['status'], string> = {
  OK: '#16a34a',
  WARNING: '#b45309',
  REACHED: '#1d4ed8',
  EXCEEDED: '#b91c1c',
};

export const RollingBudgetItem = ({ budget }: { budget: RollingCategoryBudgetResult }) => {
  const accentColor = STATUS_STYLES[budget.status];
  const badgeStyle = { ['--badge-color' as string]: accentColor } as React.CSSProperties;

  return (
    <article className="budget-item">
      <header className="budget-item__header">
        <h3>{budget.category}</h3>
        <span className="budget-status" style={badgeStyle}>
          {budget.status}
        </span>
      </header>

      <dl className="budget-metrics">
        <div>
          <dt>Fenêtre</dt>
          <dd>{budget.windowMonths} mois</dd>
        </div>
        <div>
          <dt>Dépensé</dt>
          <dd>{formatCurrency(budget.totalSpent)}</dd>
        </div>
        <div>
          <dt>Budget</dt>
          <dd>{formatCurrency(budget.budgetAmount)}</dd>
        </div>
        <div>
          <dt>Ratio</dt>
          <dd>{`${budget.ratio}%`}</dd>
        </div>
      </dl>
    </article>
  );
};
