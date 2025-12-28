import React from 'react';
import type { CategoryBudgetTrendResult } from '@/lib/types';

export const BudgetTrendItem = ({ trend }: { trend: CategoryBudgetTrendResult }) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  // Configuration des couleurs et icônes selon la tendance
  const trendConfig = {
    INCREASING: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: '↑',
      label: 'En hausse',
      deltaColor: 'text-red-600'
    },
    DECREASING: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: '↓',
      label: 'En baisse',
      deltaColor: 'text-green-600'
    },
    STABLE: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: '→',
      label: 'Stable',
      deltaColor: 'text-slate-600'
    },
    NO_HISTORY: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      icon: '—',
      label: 'Pas d\'historique',
      deltaColor: 'text-slate-600'
    },
  };

  const config = trendConfig[trend.trend] || trendConfig.NO_HISTORY;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{trend.category}</h3>
          <p className="text-sm text-slate-600 mt-0.5">Comparaison mois actuel vs précédent</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text} flex items-center gap-1`}>
          <span className="text-base">{config.icon}</span>
          {config.label}
        </span>
      </div>

      {/* Comparaison visuelle */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Mois précédent</p>
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(trend.previous)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Mois actuel</p>
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(trend.current)}</p>
        </div>
      </div>

      {/* Variation */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Variation</span>
          <div className="text-right">
            <p className={`text-sm font-semibold ${config.deltaColor}`}>
              {trend.delta > 0 ? '+' : ''}{formatCurrency(trend.delta)}
            </p>
            <p className={`text-xs font-medium ${config.deltaColor}`}>
              {trend.percentChange > 0 ? '+' : ''}{trend.percentChange.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};
