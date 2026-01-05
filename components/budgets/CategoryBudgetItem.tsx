'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingDown, AlertCircle, Info, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { CategoryBudgetResult } from '@/lib/types';

type Props = {
  budgetResult: CategoryBudgetResult;
};

export default function CategoryBudgetItem({ budgetResult }: Props) {
  const ratio =
    budgetResult.budget > 0
      ? Math.round((budgetResult.spent / budgetResult.budget) * 100)
      : 0;

  const fixedRatio = budgetResult.budget > 0
    ? (budgetResult.fixedCharges / budgetResult.budget) * 100
    : 0;

  const variableRatio = budgetResult.budget > 0
    ? (budgetResult.variableSpent / budgetResult.budget) * 100
    : 0;

  const statusColors = {
    OK: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      icon: Target,
      label: 'Maîtrisé'
    },
    WARNING: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      icon: Info,
      label: 'Proche Limite'
    },
    EXCEEDED: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
      icon: AlertCircle,
      label: 'Dépassé'
    },
  };

  const colors = statusColors[budgetResult.status] || statusColors.OK;
  const StatusIcon = colors.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6 flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{budgetResult.category}</h3>
            <ArrowUpRight className="h-3 w-3 text-slate-300" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Budget Mensuel</p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border ${colors.bg} ${colors.text} ${colors.border} flex items-center gap-2`}>
          <StatusIcon className="h-3 w-3" />
          <span className="text-[10px] font-black tracking-widest uppercase">{colors.label}</span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-baseline gap-1">
            <span className="font-black text-slate-900 text-lg">{formatCurrency(budgetResult.spent)}</span>
            <span className="text-slate-400 text-xs">/ {formatCurrency(budgetResult.budget)}</span>
          </div>
          <span className={`font-black ${ratio > 100 ? 'text-rose-600' : 'text-slate-900'}`}>{ratio}%</span>
        </div>

        {/* Triple-layer progress bar */}
        <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          {/* Fixed Charges Part */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, fixedRatio)}%` }}
            className="absolute left-0 top-0 h-full bg-orange-400 z-10 rounded-full"
          />
          {/* Variable Spent Part */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100 - fixedRatio, variableRatio)}%` }}
            style={{ left: `${fixedRatio}%` }}
            className="absolute top-0 h-full bg-indigo-500 z-20 rounded-full"
          />
          {/* Overlay for overflow */}
          {ratio > 100 && (
            <div className="absolute inset-0 bg-rose-500/20 z-0 animate-pulse" />
          )}
        </div>

        <div className="flex justify-between items-center px-1">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              Fixe
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              Variable
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Laisse {formatCurrency(Math.max(0, budgetResult.remaining))}
          </div>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
        <div className="p-3 rounded-2xl bg-orange-50/50">
          <p className="text-[9px] font-black uppercase tracking-widest text-orange-600/60 mb-1">Charges Fixes</p>
          <p className="text-sm font-black text-slate-900">{formatCurrency(budgetResult.fixedCharges)}</p>
        </div>
        <div className="p-3 rounded-2xl bg-indigo-50/50">
          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600/60 mb-1">Variables</p>
          <p className="text-sm font-black text-slate-900">{formatCurrency(budgetResult.variableSpent)}</p>
        </div>
      </div>
    </motion.article>
  );
}
