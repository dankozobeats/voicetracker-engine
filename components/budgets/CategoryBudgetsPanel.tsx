import React from 'react';
import type { CategoryBudgetResult } from '@/lib/types';
import CategoryBudgetItem from './CategoryBudgetItem';
import Link from 'next/link';

export const CategoryBudgetsPanel = ({ budgets }: { budgets: CategoryBudgetResult[] }) => {
  if (budgets.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun budget mensuel</h3>
          <p className="text-sm text-slate-600 mb-4">
            Créez vos premiers budgets mensuels pour suivre vos dépenses par catégorie.
          </p>
          <Link
            href="/budgets/manage"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Créer un budget
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Budgets mensuels</h2>
          <p className="text-sm text-slate-600 mt-1">
            Suivi de vos budgets par catégorie pour le mois en cours
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
          <CategoryBudgetItem key={budget.category} budgetResult={budget} />
        ))}
      </div>
    </section>
  );
};
