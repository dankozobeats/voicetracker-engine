import React from 'react';
import type { MultiMonthBudgetResult } from '@/lib/types';
import { MultiMonthBudgetItem } from './MultiMonthBudgetItem';
import Link from 'next/link';

export const MultiMonthBudgetsPanel = ({ budgets }: { budgets: MultiMonthBudgetResult[] }) => {
  if (budgets.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun budget multi-mois</h3>
          <p className="text-sm text-slate-600 mb-4">
            Les budgets multi-mois permettent de suivre vos dépenses sur une période fixe (trimestre, semestre, année).
          </p>
          <Link
            href="/budgets/manage"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Créer un budget multi-mois
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Budgets multi-mois</h2>
          <p className="text-sm text-slate-600 mt-1">
            Suivi sur période fixe (trimestre, semestre, etc.)
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
          <MultiMonthBudgetItem key={`${budget.category}-${budget.periodStart}`} budget={budget} />
        ))}
      </div>
    </section>
  );
};
