import React from 'react';
import type { RollingCategoryBudgetResult } from '@/lib/types';
import { RollingBudgetItem } from './RollingBudgetItem';
import Link from 'next/link';

export const RollingBudgetsPanel = ({ budgets }: { budgets: RollingCategoryBudgetResult[] }) => {
  if (budgets.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun budget glissant</h3>
          <p className="text-sm text-slate-600 mb-4">
            Les budgets glissants permettent de suivre vos dépenses sur une fenêtre mobile (ex: 3 derniers mois).
          </p>
          <Link
            href="/budgets/manage"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Créer un budget glissant
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Budgets glissants</h2>
          <p className="text-sm text-slate-600 mt-1">
            Suivi sur fenêtre mobile de plusieurs mois
          </p>
        </div>
        <Link
          href="/budgets/manage"
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Gérer
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((budget) => (
          <RollingBudgetItem key={`${budget.category}-${budget.windowMonths}`} budget={budget} />
        ))}
      </div>
    </section>
  );
};
