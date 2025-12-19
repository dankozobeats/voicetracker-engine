import React from 'react';
import type { CategoryBudgetTrendResult } from '@/lib/types';

export const BudgetTrendItem = ({ trend }: { trend: CategoryBudgetTrendResult }) => {
  return (
    <article className="budget-item">
      <header className="budget-item__header">
        <h3>{trend.category}</h3>
        <span className="budget-status" style={{ borderColor: '#1f2937', color: '#1f2937' }}>
          {trend.trend}
        </span>
      </header>

      <dl className="budget-metrics">
        <div>
          <dt>Courant</dt>
          <dd>{trend.current}</dd>
        </div>
        <div>
          <dt>Précédent</dt>
          <dd>{trend.previous}</dd>
        </div>
        <div>
          <dt>Delta</dt>
          <dd>{trend.delta}</dd>
        </div>
        <div>
          <dt>Variation</dt>
          <dd>{`${trend.percentChange}%`}</dd>
        </div>
      </dl>
    </article>
  );
};
