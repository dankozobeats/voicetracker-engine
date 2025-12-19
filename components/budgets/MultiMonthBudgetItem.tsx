import React from 'react';
import type { MultiMonthBudgetResult } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

const STATUS_STYLES: Record<MultiMonthBudgetResult['status'], string> = {
  OK: '#16a34a',
  WARNING: '#b45309',
  REACHED: '#1d4ed8',
  EXCEEDED: '#b91c1c',
  INACTIVE: '#6b7280',
};

export const MultiMonthBudgetItem = ({ budget }: { budget: MultiMonthBudgetResult }) => {
  const accentColor = STATUS_STYLES[budget.status];

  return (
    <article className="budget-item">
      <header className="budget-item__header">
        <h3>{budget.category}</h3>
        <span className="budget-status" style={{ borderColor: accentColor, color: accentColor }}>
          {budget.status}
        </span>
      </header>

      <p className="budget-period">
        {budget.periodStart} → {budget.periodEnd}
      </p>

      <dl className="budget-metrics">
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
