import { CategoryBudgetResult } from '@/lib/types';

type Props = {
  budgetResult: CategoryBudgetResult;
};

export default function CategoryBudgetItem({ budgetResult }: Props) {
  const ratio =
    budgetResult.budget > 0
      ? Math.min(Math.round((budgetResult.spent / budgetResult.budget) * 100), 100)
      : 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  // Couleurs selon le statut
  const statusColors = {
    OK: { bg: 'bg-green-100', text: 'text-green-800', bar: 'bg-green-500', label: 'Dans le budget' },
    WARNING: { bg: 'bg-orange-100', text: 'text-orange-800', bar: 'bg-orange-500', label: 'Attention' },
    EXCEEDED: { bg: 'bg-red-100', text: 'text-red-800', bar: 'bg-red-500', label: 'Dépassé' },
  };

  const colors = statusColors[budgetResult.status] || statusColors.OK;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{budgetResult.category}</h3>
          <p className="text-sm text-slate-600 mt-0.5">Budget mensuel</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
          {colors.label}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-slate-700">
            {formatCurrency(budgetResult.spent)} / {formatCurrency(budgetResult.budget)}
          </span>
          <span className="text-sm font-semibold text-slate-900">{ratio}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all ${colors.bar}`}
            style={{ width: `${ratio}%` }}
          />
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-500">Charges fixes</p>
          <p className="text-sm font-medium text-orange-600">{formatCurrency(budgetResult.fixedCharges)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Dépenses variables</p>
          <p className="text-sm font-medium text-blue-600">{formatCurrency(budgetResult.variableSpent)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total dépensé</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(budgetResult.spent)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Restant</p>
          <p className={`text-sm font-semibold ${budgetResult.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(budgetResult.remaining)}
          </p>
        </div>
      </div>
    </article>
  );
}
