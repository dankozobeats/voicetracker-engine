'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/format';
import type { MonthProjection } from '@/lib/types';

// Import existing components
import { BalanceProjection } from '@/components/projection/BalanceProjection';

interface EnginePayload {
  months: MonthProjection[];
  alertTexts: Array<{
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
  }>;
}

type TabView = 'current' | 'projection' | 'budgets';

export default function OverviewClient() {
  const [activeTab, setActiveTab] = useState<TabView>('current');
  const [data, setData] = useState<EnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const response = await fetch(`/api/engine/projection?account=SG&month=${month}&months=12`);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const json = await response.json();
      setData(json.payload);
    } catch (err) {
      console.error('Error fetching overview data:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-64"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-4 gap-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
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
            <p className="text-red-700">{error || 'Impossible de charger les données'}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentMonth = data.months[0];
  const variation = currentMonth.endingBalance - currentMonth.openingBalance;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vue Financière</h1>
            <p className="text-slate-600 mt-1">
              Analyse complète de votre situation financière
            </p>
          </div>
          <div className="text-sm text-slate-500">
            Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border-2 border-slate-200 p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition ${
              activeTab === 'current'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📅 Mois Actuel
          </button>
          <button
            onClick={() => setActiveTab('projection')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition ${
              activeTab === 'projection'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📈 Projection 12 Mois
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition ${
              activeTab === 'budgets'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🎯 Performance Budgets
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'current' && (
          <div className="space-y-6">
            {/* KPIs du mois */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Solde Début
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(currentMonth.openingBalance)}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg border-2 border-green-200 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-2">
                  Revenus
                </p>
                <p className="text-3xl font-bold text-green-600">
                  +{formatCurrency(currentMonth.income)}
                </p>
              </div>

              <div className="bg-red-50 rounded-lg border-2 border-red-200 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-700 mb-2">
                  Dépenses
                </p>
                <p className="text-3xl font-bold text-red-600">
                  -{formatCurrency(currentMonth.expenses)}
                </p>
              </div>

              <div className={`rounded-lg border-2 p-6 ${
                variation >= 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Solde Final
                </p>
                <p className={`text-3xl font-bold ${
                  variation >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {formatCurrency(currentMonth.endingBalance)}
                </p>
                <p className={`text-sm mt-1 ${
                  variation >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {variation >= 0 ? '+' : ''}{formatCurrency(variation)} ce mois
                </p>
              </div>
            </div>

            {/* Charges fixes */}
            {currentMonth.fixedCharges > 0 && (
              <div className="bg-amber-50 rounded-lg border-2 border-amber-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
                      Charges Fixes Récurrentes
                    </p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(currentMonth.fixedCharges)}
                    </p>
                  </div>
                  <div className="text-amber-600">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Budgets Top 5 */}
            {currentMonth.categoryBudgets && currentMonth.categoryBudgets.length > 0 && (
              <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Top 5 Budgets par Catégorie
                </h2>
                <div className="space-y-4">
                  {currentMonth.categoryBudgets.slice(0, 5).map((budget) => {
                    const percentUsed = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
                    const isOverBudget = percentUsed > 100;
                    const isWarning = percentUsed > 80 && !isOverBudget;

                    return (
                      <div key={budget.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">{budget.category}</span>
                          <div className="text-right">
                            <span className={`font-semibold ${
                              isOverBudget ? 'text-red-600' : 'text-slate-600'
                            }`}>
                              {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                            </span>
                            <span className={`ml-2 text-sm ${
                              isOverBudget ? 'text-red-600' :
                              isWarning ? 'text-orange-600' :
                              'text-slate-500'
                            }`}>
                              ({Math.round(percentUsed)}%)
                            </span>
                          </div>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              isOverBudget ? 'bg-red-500' :
                              isWarning ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                          />
                        </div>
                        {isOverBudget && (
                          <p className="text-sm text-red-600">
                            ⚠️ Dépassement de {formatCurrency(budget.spent - budget.budget)}
                          </p>
                        )}
                        {isWarning && (
                          <p className="text-sm text-orange-600">
                            ⚡ Attention, {Math.round(100 - percentUsed)}% restant
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alertes */}
            {data.alertTexts && data.alertTexts.length > 0 && (
              <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Alertes et Notifications
                </h2>
                <div className="space-y-3">
                  {data.alertTexts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-50 border-red-200'
                          : alert.severity === 'WARNING'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {alert.severity === 'CRITICAL' ? '🚨' :
                           alert.severity === 'WARNING' ? '⚠️' : 'ℹ️'}
                        </span>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${
                            alert.severity === 'CRITICAL' ? 'text-red-900' :
                            alert.severity === 'WARNING' ? 'text-orange-900' :
                            'text-blue-900'
                          }`}>
                            {alert.title}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            alert.severity === 'CRITICAL' ? 'text-red-700' :
                            alert.severity === 'WARNING' ? 'text-orange-700' :
                            'text-blue-700'
                          }`}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projection' && (
          <BalanceProjection projections={data.months} />
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Performance des Budgets - {currentMonth.month}
              </h2>

              {currentMonth.categoryBudgets && currentMonth.categoryBudgets.length > 0 ? (
                <div className="space-y-6">
                  {currentMonth.categoryBudgets.map((budget) => {
                    const percentUsed = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
                    const remaining = budget.budget - budget.spent;

                    return (
                      <div key={budget.category} className="border-2 border-slate-100 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-slate-800">{budget.category}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            budget.status === 'EXCEEDED'
                              ? 'bg-red-100 text-red-700'
                              : budget.status === 'WARNING'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {budget.status === 'EXCEEDED' ? 'Dépassé' :
                             budget.status === 'WARNING' ? 'Attention' : 'OK'}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Budget</p>
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(budget.budget)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Charges Fixes</p>
                            <p className="font-semibold text-blue-600">
                              {formatCurrency(budget.fixedCharges)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Dépenses Variables</p>
                            <p className="font-semibold text-purple-600">
                              {formatCurrency(budget.variableSpent)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Restant</p>
                            <p className={`font-semibold ${
                              remaining >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(remaining)}
                            </p>
                          </div>
                        </div>

                        <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-4 transition-all ${
                              percentUsed > 100 ? 'bg-red-500' :
                              percentUsed > 80 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          {Math.round(percentUsed)}% utilisé
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500">Aucun budget configuré pour ce mois</p>
                  <a
                    href="/budgets/manage"
                    className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Créer un budget
                  </a>
                </div>
              )}
            </div>

            {/* Tendances budgets */}
            {currentMonth.trends && currentMonth.trends.length > 0 && (
              <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Tendances par Catégorie
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentMonth.trends.map((trend) => (
                    <div key={trend.category} className="border-2 border-slate-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700">{trend.category}</span>
                        <span className={`flex items-center gap-1 text-sm font-semibold ${
                          trend.trend === 'INCREASING' ? 'text-red-600' :
                          trend.trend === 'DECREASING' ? 'text-green-600' :
                          'text-slate-600'
                        }`}>
                          {trend.trend === 'INCREASING' ? '↗' :
                           trend.trend === 'DECREASING' ? '↘' : '→'}
                          {trend.percentChange >= 0 ? '+' : ''}
                          {trend.percentChange.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <span>Actuel: {formatCurrency(trend.current)}</span>
                        <span className="mx-2">→</span>
                        <span>Précédent: {formatCurrency(trend.previous)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
