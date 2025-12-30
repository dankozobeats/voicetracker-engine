'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CategoryBudgetsPanel } from '@/components/budgets/CategoryBudgetsPanel';
import { RollingBudgetsPanel } from '@/components/budgets/RollingBudgetsPanel';
import { MultiMonthBudgetsPanel } from '@/components/budgets/MultiMonthBudgetsPanel';
import { BudgetTrendsPanel } from '@/components/budgets/BudgetTrendsPanel';
import Link from 'next/link';
import type { CategoryBudgetResult } from '@/lib/types';
import type { RollingCategoryBudgetResult } from '@/lib/types';
import type { MultiMonthBudgetResult } from '@/lib/types';
import type { CategoryBudgetTrendResult } from '@/lib/types';

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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError('Vous devez être connecté pour voir vos budgets');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/budgets');

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des budgets');
        }

        const data = (await response.json()) as BudgetsData;

        // Les données viennent maintenant directement de l'Engine avec les valeurs calculées
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
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-600">Chargement des budgets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!budgets) {
    return null;
  }

  const hasAnyBudget =
    budgets.categoryBudgets.length > 0 ||
    budgets.rollingBudgets.length > 0 ||
    budgets.multiMonthBudgets.length > 0 ||
    budgets.trends.length > 0;

  if (!hasAnyBudget) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">Aucun budget défini</h2>
          <p className="mb-6 text-slate-600">Créez votre premier budget pour commencer le suivi de vos dépenses.</p>
          <Link
            href="/budgets/manage"
            className="inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Créer un budget
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'monthly' as TabType,
      label: 'Budgets mensuels',
      count: budgets.categoryBudgets.length,
      icon: '📊',
    },
    {
      id: 'rolling' as TabType,
      label: 'Budgets glissants',
      count: budgets.rollingBudgets.length,
      icon: '📈',
    },
    {
      id: 'multi' as TabType,
      label: 'Budgets multi-mois',
      count: budgets.multiMonthBudgets.length,
      icon: '📅',
    },
    {
      id: 'trends' as TabType,
      label: 'Évolution',
      count: budgets.trends.length,
      icon: '📉',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }
              `}
            >
              <span className="flex items-center gap-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`
                      rounded-full px-2 py-0.5 text-xs font-semibold
                      ${
                        activeTab === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'monthly' && <CategoryBudgetsPanel budgets={budgets.categoryBudgets} />}
        {activeTab === 'rolling' && <RollingBudgetsPanel budgets={budgets.rollingBudgets} />}
        {activeTab === 'multi' && <MultiMonthBudgetsPanel budgets={budgets.multiMonthBudgets} />}
        {activeTab === 'trends' && <BudgetTrendsPanel trends={budgets.trends} />}
      </div>
    </div>
  );
};


