'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Target, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { MultiMonthBudgetResult } from '@/lib/types';

export const MultiMonthBudgetItem = ({ budget }: { budget: MultiMonthBudgetResult }) => {
  const ratio = Math.min(budget.ratio, 100);
  const remaining = budget.budgetAmount - budget.totalSpent;

  const statusColors = {
    OK: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: Target, label: 'Maîtrisé' },
    WARNING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: Info, label: 'Attention' },
    REACHED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', icon: Target, label: 'Atteint' },
    EXCEEDED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: AlertCircle, label: 'Dépassé' },
    INACTIVE: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100', icon: Info, label: 'Inactif' },
  };

  const colors = statusColors[budget.status] || statusColors.OK;
  const StatusIcon = colors.icon;

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">{budget.category}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>{budget.periodStart}</span>
              <ArrowRight className="h-2 w-2" />
              <span>{budget.periodEnd}</span>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border ${colors.bg} ${colors.text} ${colors.border} flex items-center gap-2`}>
          <StatusIcon className="h-3 w-3" />
          <span className="text-[10px] font-black tracking-widest uppercase">{colors.label}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-baseline gap-1">
            <span className="font-black text-slate-900 text-lg">{formatCurrency(budget.totalSpent)}</span>
            <span className="text-slate-400 text-xs">/ {formatCurrency(budget.budgetAmount)}</span>
          </div>
          <span className={`font-black ${budget.ratio > 100 ? 'text-rose-600' : 'text-slate-900'}`}>{budget.ratio}%</span>
        </div>

        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ratio}%` }}
            className={`h-full rounded-full ${budget.ratio > 100 ? 'bg-rose-500' : 'bg-amber-500'}`}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Plafond Multi-Mois</p>
          <p className={`text-sm font-black ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {remaining < 0 ? 'Dépassement de ' : 'Libre: '}{formatCurrency(Math.abs(remaining))}
          </p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-300">
          <Calendar className="h-4 w-4" />
        </div>
      </div>
    </motion.article>
  );
};
