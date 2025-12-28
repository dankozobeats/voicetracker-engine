import React from 'react';
import type { CategoryBudgetTrendResult } from '@/lib/types';
import { BudgetTrendItem } from './BudgetTrendItem';

export const BudgetTrendsPanel = ({ trends }: { trends: CategoryBudgetTrendResult[] }) => {
  if (trends.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de tendances
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Évolution des dépenses</h2>
        <p className="text-sm text-slate-600 mt-1">
          Comparaison de vos dépenses par catégorie entre le mois actuel et le mois précédent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((trend) => (
          <BudgetTrendItem key={trend.category} trend={trend} />
        ))}
      </div>
    </section>
  );
};
