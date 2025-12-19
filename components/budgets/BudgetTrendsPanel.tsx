import React from 'react';
import type { CategoryBudgetTrendResult } from '@/lib/types';
import { BudgetTrendItem } from './BudgetTrendItem';

export const BudgetTrendsPanel = ({ trends }: { trends: CategoryBudgetTrendResult[] }) => {
  return (
    <section className="budgets-panel" aria-label="Tendances budgets">
      <header className="panel-header">
        <p className="eyebrow">Tendances</p>
        <h2>Budget trends</h2>
      </header>

      <div className="budget-list">
        {trends.map((trend) => (
          <BudgetTrendItem key={trend.category} trend={trend} />
        ))}
      </div>
    </section>
  );
};
