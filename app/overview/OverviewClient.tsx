'use client';

import { useState } from 'react';
import type { TimeRange } from '@/hooks/useProjection';
import { useProjection } from '@/hooks/useProjection';
import { KPIGrid } from '@/components/overview/KPIGrid';
import { BudgetList } from '@/components/overview/BudgetList';
import { AlertCenter } from '@/components/overview/AlertCenter';
import { BalanceProjection } from '@/components/projection/BalanceProjection';
import { motion, AnimatePresence } from 'framer-motion';
import type { EnginePayload } from '@/lib/types';

type TabView = 'current' | 'projection' | 'budgets';
type Account = 'SG' | 'FLOA';

export default function OverviewClient({ initialData }: { initialData?: EnginePayload | null }) {
  const [activeTab, setActiveTab] = useState<TabView>('current');
  const [projectionMonths, setProjectionMonths] = useState<TimeRange>(3);
  const [account, setAccount] = useState<Account>('SG');

  const { data, isLoading, error } = useProjection(account, projectionMonths, initialData);

  if (isLoading && !initialData) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="flex justify-between items-end">
            <div className="space-y-3">
              <div className="h-10 bg-slate-200 rounded-lg w-64 animate-pulse"></div>
              <div className="h-5 bg-slate-100 rounded-md w-48 animate-pulse"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-12 bg-slate-200 rounded-lg w-32 animate-pulse"></div>
              <div className="h-12 bg-slate-200 rounded-lg w-24 animate-pulse"></div>
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="h-14 bg-white border-2 border-slate-100 rounded-xl w-full animate-pulse"></div>

          {/* KPI Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-white border-2 border-slate-100 rounded-2xl p-6 space-y-4">
                <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-slate-50 rounded w-full animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[400px] bg-white border-2 border-slate-100 rounded-2xl animate-pulse"></div>
            <div className="h-[400px] bg-white border-2 border-slate-100 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Erreur</h2>
            <p className="text-red-700">Impossible de charger les données. Veuillez vérifier votre connexion.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentMonth = data.months[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header with Account Selector */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Vue Financière</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Analyse de votre situation financière
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Account Selector */}
            <div className="flex bg-white rounded-lg border-2 border-slate-200 p-1">
              <button
                onClick={() => setAccount('SG')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${account === 'SG'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                SG
              </button>
              <button
                onClick={() => setAccount('FLOA')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${account === 'FLOA'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                FLOA
              </button>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <select
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(Number(e.target.value) as TimeRange)}
                className="w-full sm:w-auto px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition"
              >
                <option value={3}>3 mois</option>
                <option value={6}>6 mois</option>
                <option value={12}>12 mois</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border-2 border-slate-200 p-1 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 min-w-[100px] px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base font-medium transition ${activeTab === 'current'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            📅 Synthèse
          </button>
          <button
            onClick={() => setActiveTab('projection')}
            className={`flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base font-medium transition whitespace-nowrap ${activeTab === 'projection'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            📈 Projection
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex-1 min-w-[100px] px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base font-medium transition ${activeTab === 'budgets'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            🎯 Budgets
          </button>
        </div>

        {/* Content Area with Animation */}
        <AnimatePresence mode="wait">
          {activeTab === 'current' && (
            <motion.div
              key="current"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <KPIGrid currentMonth={currentMonth} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlertCenter alerts={data.alertTexts} />
                <BudgetList categoryBudgets={currentMonth.categoryBudgets} />
              </div>
            </motion.div>
          )}

          {activeTab === 'projection' && (
            <motion.div
              key="projection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <BalanceProjection projections={data.months} />
            </motion.div>
          )}

          {activeTab === 'budgets' && (
            <motion.div
              key="budgets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <BudgetList categoryBudgets={currentMonth.categoryBudgets} />
              {/* Optional: Add Budget Trends here if needed */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
