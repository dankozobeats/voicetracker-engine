'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CategoryBudgetsPanel } from '@/components/budgets/CategoryBudgetsPanel';
import { RollingBudgetsPanel } from '@/components/budgets/RollingBudgetsPanel';
import { MultiMonthBudgetsPanel } from '@/components/budgets/MultiMonthBudgetsPanel';
import { BudgetTrendsPanel } from '@/components/budgets/BudgetTrendsPanel';
import { BudgetSummary } from '@/components/budgets/BudgetSummary';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, TrendingUp, Calendar, Layers, Plus } from 'lucide-react';
import type { CategoryBudgetResult, RollingCategoryBudgetResult, MultiMonthBudgetResult, CategoryBudgetTrendResult } from '@/lib/types';

interface BudgetsData {
  categoryBudgets: CategoryBudgetResult[];
  rollingBudgets: RollingCategoryBudgetResult[];
  multiMonthBudgets: MultiMonthBudgetResult[];
  trends: CategoryBudgetTrendResult[];
}

type TabType = 'monthly' | 'rolling' | 'multi' | 'trends';

export const BudgetsClient = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<BudgetsData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('monthly');

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Vous devez être connecté pour voir vos budgets');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/budgets');
        if (!response.ok) throw new Error('Erreur lors du chargement des budgets');

        const data = (await response.json()) as BudgetsData;
        setBudgets({
          categoryBudgets: data.categoryBudgets || [],
          rollingBudgets: data.rollingBudgets || [],
          multiMonthBudgets: data.multiMonthBudgets || [],
          trends: data.trends || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Analysing Budgets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg mt-20 p-8 rounded-[40px] bg-rose-50 border border-rose-100 text-center">
        <p className="text-rose-600 font-black mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!budgets) return null;

  const hasAnyBudget =
    budgets.categoryBudgets.length > 0 ||
    budgets.rollingBudgets.length > 0 ||
    budgets.multiMonthBudgets.length > 0 ||
    budgets.trends.length > 0;

  if (!hasAnyBudget) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-md text-center p-12 rounded-[56px] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50"
        >
          <div className="mb-8 flex justify-center">
            <div className="p-6 rounded-[32px] bg-indigo-50 text-indigo-500">
              <Plus className="h-12 w-12" />
            </div>
          </div>
          <h2 className="mb-3 text-3xl font-black tracking-tight text-slate-900">Zéro Budget ?</h2>
          <p className="mb-8 text-slate-500 font-medium text-lg leading-relaxed">
            Prenez le contrôle de votre argent dès maintenant en définissant vos plafonds de dépenses.
          </p>
          <Link
            href="/budgets/new"
            className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-black text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20"
          >
            <Plus className="h-5 w-5" />
            Créer un budget
          </Link>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'monthly' as TabType, label: 'Mensuels', icon: PieChart, color: 'text-indigo-500', bg: 'bg-indigo-50', count: budgets.categoryBudgets.length },
    { id: 'rolling' as TabType, label: 'Glissants', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', count: budgets.rollingBudgets.length },
    { id: 'multi' as TabType, label: 'Multi-mois', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50', count: budgets.multiMonthBudgets.length },
    { id: 'trends' as TabType, label: 'Evolution', icon: Layers, color: 'text-purple-500', bg: 'bg-purple-50', count: budgets.trends.length },
  ];

  return (
    <div className="space-y-12">
      {/* Dashboard Summary Section */}
      <BudgetSummary budgets={budgets.categoryBudgets} />

      {/* Navigation Section */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Analyse Détaillée</h2>
            <p className="text-slate-400 font-medium tracking-wide">Explorez vos dépenses par type de budget</p>
          </div>

          <div className="p-1.5 rounded-[20px] bg-slate-100 flex gap-1 items-center overflow-x-auto no-scrollbar scroll-smooth">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm translate-y-[-1px]'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <tab.icon className={`h-3.5 w-3.5 ${activeTab === tab.id ? tab.color : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === tab.id ? `${tab.bg} ${tab.color}` : 'bg-slate-200 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Section */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[400px]"
        >
          {activeTab === 'monthly' && <CategoryBudgetsPanel budgets={budgets.categoryBudgets} />}
          {activeTab === 'rolling' && <RollingBudgetsPanel budgets={budgets.rollingBudgets} />}
          {activeTab === 'multi' && <MultiMonthBudgetsPanel budgets={budgets.multiMonthBudgets} />}
          {activeTab === 'trends' && <BudgetTrendsPanel trends={budgets.trends} />}
        </motion.div>
      </div>

    </div>
  );
};
