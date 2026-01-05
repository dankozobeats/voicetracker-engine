'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, History, BarChart3, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { CategoryBudgetTrendResult } from '@/lib/types';

interface BudgetTrendItemProps {
  trend: CategoryBudgetTrendResult;
}

export const BudgetTrendItem: React.FC<BudgetTrendItemProps> = ({ trend }) => {
  const trendConfig = {
    INCREASING: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
      icon: TrendingUp,
      label: 'En hausse',
    },
    DECREASING: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      icon: TrendingDown,
      label: 'En baisse',
    },
    STABLE: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-100',
      icon: Minus,
      label: 'Stable',
    },
    NO_HISTORY: {
      bg: 'bg-slate-50',
      text: 'text-slate-500',
      border: 'border-slate-100',
      icon: History,
      label: 'Nouveau',
    },
  };

  const config = trendConfig[trend.trend] || trendConfig.NO_HISTORY;
  const Icon = config.icon;

  const maxValue = Math.max(trend.current, trend.previous, 1);
  const currentWidth = (trend.current / maxValue) * 100;
  const previousWidth = (trend.previous / maxValue) * 100;

  return (
    <motion.article
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -5 }}
      className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{trend.category}</h3>
            <BarChart3 className="h-3 w-3 text-slate-300" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comparaison Mensuelle</p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border ${config.bg} ${config.text} ${config.border} flex items-center gap-2`}>
          <Icon className="h-3 w-3" />
          <span className="text-[10px] font-black tracking-widest uppercase">{config.label}</span>
        </div>
      </div>

      {/* Comparison Bars */}
      <div className="space-y-6 pt-2">
        {/* Previous Month */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Mois Précédent</span>
            <span className="text-slate-600">{formatCurrency(trend.previous)}</span>
          </div>
          <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${previousWidth}%` }}
              className="h-full bg-slate-300 rounded-full"
            />
          </div>
        </div>

        <div className="flex justify-center -my-2">
          <div className="bg-slate-50 p-1.5 rounded-full border border-slate-100 text-slate-300">
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Current Month */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span className="text-indigo-600">Mois Actuel</span>
            <span className="text-slate-900 font-black">{formatCurrency(trend.current)}</span>
          </div>
          <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${currentWidth}%` }}
              className="h-full bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Variation Indicator */}
      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${config.bg} ${config.text}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variation</p>
            <p className={`text-sm font-black ${trend.delta > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {trend.delta > 0 ? '+' : ''}{formatCurrency(trend.delta)}
            </p>
          </div>
        </div>
        <div className={`text-lg font-black tracking-tighter ${trend.percentChange > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {trend.percentChange > 0 ? '+' : ''}{trend.percentChange.toFixed(1)}%
        </div>
      </div>
    </motion.article>
  );
};
