import React from 'react';
import type { RollingCategoryBudgetResult } from '@/lib/types';

export const RollingBudgetItem = ({ budget }: { budget: RollingCategoryBudgetResult }) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  // Couleurs selon le statut
  const statusColors = {
    OK: { bg: 'bg-green-100', text: 'text-green-800', bar: 'bg-green-500', label: 'Dans le budget' },
    WARNING: { bg: 'bg-orange-100', text: 'text-orange-800', bar: 'bg-orange-500', label: 'Attention' },
    REACHED: { bg: 'bg-blue-100', text: 'text-blue-800', bar: 'bg-blue-500', label: 'Atteint' },
    EXCEEDED: { bg: 'bg-red-100', text: 'text-red-800', bar: 'bg-red-500', label: 'Dépassé' },
  };

  const colors = statusColors[budget.status] || statusColors.OK;
  const remaining = budget.budgetAmount - budget.totalSpent;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{budget.category}</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Glissant sur {budget.windowMonths} mois
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
          {colors.label}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-slate-700">
            {formatCurrency(budget.totalSpent)} / {formatCurrency(budget.budgetAmount)}
          </span>
          <span className="text-sm font-semibold text-slate-900">{budget.ratio}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all ${colors.bar}`}
            style={{ width: `${Math.min(budget.ratio, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-500">Dépensé</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(budget.totalSpent)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Restant</p>
          <p className={`text-sm font-semibold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
    </article>
  );
};
