'use client';

import React, { useState } from 'react';
import type { MonthProjection } from '@/lib/types';

interface BalanceProjectionProps {
  projections: MonthProjection[];
}

type TimeRange = 3 | 6 | 12;

export const BalanceProjection = ({ projections }: BalanceProjectionProps) => {
  const [monthsToShow, setMonthsToShow] = useState<TimeRange>(6);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  };

  const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  if (projections.length === 0) {
    return null;
  }

  // Limit projections based on selected range
  const displayedProjections = projections.slice(0, monthsToShow);

  // Calculate advanced metrics
  const metrics = displayedProjections.map((proj, index) => {
    const totalInflow = proj.income + proj.deferredIn;
    const totalOutflow = proj.expenses + proj.fixedCharges + proj.carriedOverDeficit;
    const netFlow = totalInflow - totalOutflow;
    const savingsRate = totalInflow > 0 ? (netFlow / totalInflow) * 100 : 0;
    const burnRate = proj.openingBalance > 0 && netFlow < 0
      ? Math.abs(proj.openingBalance / netFlow)
      : null; // Months until broke

    // Health status
    let healthStatus: 'critical' | 'warning' | 'ok' | 'excellent';
    let healthLabel: string;
    let healthColor: string;

    if (proj.endingBalance < 0) {
      healthStatus = 'critical';
      healthLabel = 'DÉFICIT';
      healthColor = 'bg-red-100 text-red-800 border-red-300';
    } else if (proj.endingBalance < 500) {
      healthStatus = 'warning';
      healthLabel = 'CRITIQUE';
      healthColor = 'bg-orange-100 text-orange-800 border-orange-300';
    } else if (proj.endingBalance < 1000) {
      healthStatus = 'ok';
      healthLabel = 'FRAGILE';
      healthColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else {
      healthStatus = 'excellent';
      healthLabel = 'SAIN';
      healthColor = 'bg-green-100 text-green-800 border-green-300';
    }

    return {
      ...proj,
      totalInflow,
      totalOutflow,
      netFlow,
      savingsRate,
      burnRate,
      healthStatus,
      healthLabel,
      healthColor,
    };
  });

  // Overall analysis
  const firstMonth = metrics[0];
  const lastMonth = metrics[metrics.length - 1];
  const totalVariation = lastMonth.endingBalance - firstMonth.openingBalance;
  const averageSavingsRate = metrics.reduce((sum, m) => sum + m.savingsRate, 0) / metrics.length;
  const monthsInDeficit = metrics.filter(m => m.endingBalance < 0).length;
  const worstMonth = metrics.reduce((worst, m) => m.endingBalance < worst.endingBalance ? m : worst);
  const bestMonth = metrics.reduce((best, m) => m.endingBalance > best.endingBalance ? m : best);

  // Chart data
  const balances = metrics.map(m => m.endingBalance);
  const minBalance = Math.min(...balances, 0);
  const maxBalance = Math.max(...balances, 0);
  const range = maxBalance - minBalance;
  const padding = range * 0.1;

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Projection de solde</h2>
            <p className="text-sm text-slate-600 mt-1">
              Analyse prévisionnelle avec métriques financières avancées
            </p>
          </div>

          {/* Time range selector */}
          <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
            {([3, 6, 12] as TimeRange[]).map((months) => (
              <button
                key={months}
                onClick={() => setMonthsToShow(months)}
                disabled={projections.length < months}
                className={`
                  rounded px-4 py-2 text-sm font-medium transition
                  ${monthsToShow === months
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed'
                  }
                `}
              >
                {months} mois
              </button>
            ))}
          </div>
        </div>

        {/* Key metrics dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-lg border p-4 ${
            totalVariation >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <p className="text-xs font-medium uppercase text-slate-700">Variation totale</p>
            <p className={`mt-2 text-2xl font-bold ${totalVariation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalVariation >= 0 ? '+' : ''}{formatCurrency(totalVariation)}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {formatMonthLabel(firstMonth.month)} → {formatMonthLabel(lastMonth.month)}
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-medium uppercase text-blue-700">Taux d'épargne moyen</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {formatPercent(averageSavingsRate)}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {averageSavingsRate > 20 ? 'Excellent' : averageSavingsRate > 10 ? 'Bon' : 'À améliorer'}
            </p>
          </div>

          <div className={`rounded-lg border p-4 ${
            monthsInDeficit === 0 ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
          }`}>
            <p className="text-xs font-medium uppercase text-slate-700">Mois en déficit</p>
            <p className={`mt-2 text-2xl font-bold ${monthsInDeficit === 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {monthsInDeficit} / {metrics.length}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {monthsInDeficit === 0 ? 'Projection saine' : 'Attention requise'}
            </p>
          </div>

          <div className={`rounded-lg border p-4 ${lastMonth.healthColor.replace('text-', 'border-').replace('bg-', 'bg-')}`}>
            <p className="text-xs font-medium uppercase text-slate-700">Solde final</p>
            <p className={`mt-2 text-2xl font-bold ${lastMonth.healthColor.split(' ')[1]}`}>
              {formatCurrency(lastMonth.endingBalance)}
            </p>
            <p className={`text-xs font-semibold mt-1 ${lastMonth.healthColor.split(' ')[1]}`}>
              {lastMonth.healthLabel}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-6">
          <div className="relative h-64">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                className="absolute left-0 right-0 border-t border-slate-100"
                style={{ bottom: `${percent}%` }}
              />
            ))}

            {/* Zero line */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-slate-400"
              style={{
                bottom: `${((0 - minBalance + padding) / (range + 2 * padding)) * 100}%`
              }}
            >
              <span className="absolute -left-16 -translate-y-1/2 text-xs font-semibold text-slate-700">0€</span>
            </div>

            {/* Balance line */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <polygon
                fill="url(#balanceGradient)"
                points={[
                  ...metrics.map((m, index) => {
                    const x = (index / (metrics.length - 1)) * 100;
                    const y = 100 - ((m.endingBalance - minBalance + padding) / (range + 2 * padding)) * 100;
                    return `${x},${y}`;
                  }),
                  `100,${100 - ((0 - minBalance + padding) / (range + 2 * padding)) * 100}`,
                  `0,${100 - ((0 - minBalance + padding) / (range + 2 * padding)) * 100}`,
                ].join(' ')}
              />

              {/* Line */}
              <polyline
                fill="none"
                stroke={lastMonth.endingBalance >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={metrics.map((m, index) => {
                  const x = (index / (metrics.length - 1)) * 100;
                  const y = 100 - ((m.endingBalance - minBalance + padding) / (range + 2 * padding)) * 100;
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>

            {/* Data points */}
            {metrics.map((m, index) => {
              const x = (index / (metrics.length - 1)) * 100;
              const y = 100 - ((m.endingBalance - minBalance + padding) / (range + 2 * padding)) * 100;

              return (
                <div
                  key={m.month}
                  className="absolute group"
                  style={{
                    left: `${x}%`,
                    bottom: `${y}%`,
                    transform: 'translate(-50%, 50%)',
                  }}
                >
                  <div
                    className={`
                      w-4 h-4 rounded-full border-3 border-white shadow-lg cursor-pointer
                      transition-transform hover:scale-150
                      ${m.endingBalance < 0 ? 'bg-red-500' : m.endingBalance < 500 ? 'bg-orange-500' : m.endingBalance < 1000 ? 'bg-yellow-500' : 'bg-green-500'}
                    `}
                  />

                  {/* Enhanced tooltip */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-slate-900 text-white text-xs rounded-lg px-4 py-3 whitespace-nowrap shadow-2xl min-w-[200px]">
                      <p className="font-bold text-sm mb-2">{formatMonthLabel(m.month)}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Solde:</span>
                          <span className={`font-semibold ${m.endingBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(m.endingBalance)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Flux net:</span>
                          <span className={m.netFlow >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {m.netFlow >= 0 ? '+' : ''}{formatCurrency(m.netFlow)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Épargne:</span>
                          <span className="text-blue-400">{formatPercent(m.savingsRate)}</span>
                        </div>
                        {m.burnRate !== null && m.burnRate > 0 && (
                          <div className="flex justify-between gap-4 mt-2 pt-2 border-t border-slate-700">
                            <span className="text-orange-400">⚠️ Burn rate:</span>
                            <span className="text-orange-400">{m.burnRate.toFixed(1)} mois</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-0 h-0 mx-auto border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month labels */}
          <div className="flex justify-between mt-4 px-2">
            {metrics.map((m) => (
              <div key={m.month} className="text-xs text-slate-600 text-center flex-1">
                {formatMonthLabel(m.month)}
              </div>
            ))}
          </div>
        </div>

        {/* Alerts section */}
        {(monthsInDeficit > 0 || worstMonth.endingBalance < 500) && (
          <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-orange-600 text-xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-2">Alertes détectées</h3>
                <ul className="text-sm text-orange-800 space-y-1">
                  {monthsInDeficit > 0 && (
                    <li>• {monthsInDeficit} mois en déficit projeté - Risque de découvert</li>
                  )}
                  {worstMonth.endingBalance < 500 && worstMonth.endingBalance >= 0 && (
                    <li>• Solde critique en {formatMonthLabel(worstMonth.month)}: {formatCurrency(worstMonth.endingBalance)}</li>
                  )}
                  {worstMonth.endingBalance < 0 && (
                    <li>• Découvert projeté en {formatMonthLabel(worstMonth.month)}: {formatCurrency(worstMonth.endingBalance)}</li>
                  )}
                  {averageSavingsRate < 10 && (
                    <li>• Taux d'épargne faible ({formatPercent(averageSavingsRate)}) - Objectif: &gt;10%</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Detailed table */}
      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase sticky left-0 bg-slate-50 z-10">Mois</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ouverture</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Revenus</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Différé</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Dépenses</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Charges fixes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Déficit reporté</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Flux net</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tx épargne</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Clôture</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {metrics.map((m, index) => {
                const isCurrentMonth = index === 0;

                return (
                  <tr key={m.month} className={isCurrentMonth ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-inherit z-10">
                      {formatMonthLabel(m.month)}
                      {isCurrentMonth && <span className="ml-2 text-xs text-blue-600">(actuel)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-right tabular-nums">
                      {formatCurrency(m.openingBalance)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium text-right tabular-nums">
                      +{formatCurrency(m.income)}
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-600 font-medium text-right tabular-nums">
                      {m.deferredIn > 0 ? `+${formatCurrency(m.deferredIn)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium text-right tabular-nums">
                      -{formatCurrency(m.expenses)}
                    </td>
                    <td className="px-4 py-3 text-sm text-orange-600 font-medium text-right tabular-nums">
                      -{formatCurrency(m.fixedCharges)}
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-600 font-medium text-right tabular-nums">
                      {m.carriedOverDeficit > 0 ? `-${formatCurrency(m.carriedOverDeficit)}` : '—'}
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold text-right tabular-nums ${m.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.netFlow >= 0 ? '+' : ''}{formatCurrency(m.netFlow)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold text-right tabular-nums ${
                      m.savingsRate > 20 ? 'text-green-600' : m.savingsRate > 10 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {formatPercent(m.savingsRate)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold text-right tabular-nums ${
                      m.endingBalance < 0 ? 'text-red-600' : m.endingBalance < 500 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(m.endingBalance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold border ${m.healthColor}`}>
                        {m.healthLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Summary row */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr>
                <td className="px-4 py-3 text-sm font-bold text-slate-900 sticky left-0 bg-slate-100 z-10">TOTAL</td>
                <td className="px-4 py-3 text-sm text-slate-600 text-right"></td>
                <td className="px-4 py-3 text-sm font-bold text-green-600 text-right tabular-nums">
                  +{formatCurrency(metrics.reduce((sum, m) => sum + m.income, 0))}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-purple-600 text-right tabular-nums">
                  +{formatCurrency(metrics.reduce((sum, m) => sum + m.deferredIn, 0))}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-red-600 text-right tabular-nums">
                  -{formatCurrency(metrics.reduce((sum, m) => sum + m.expenses, 0))}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-orange-600 text-right tabular-nums">
                  -{formatCurrency(metrics.reduce((sum, m) => sum + m.fixedCharges, 0))}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-purple-600 text-right tabular-nums">
                  -{formatCurrency(metrics.reduce((sum, m) => sum + m.carriedOverDeficit, 0))}
                </td>
                <td className={`px-4 py-3 text-sm font-bold text-right tabular-nums ${
                  totalVariation >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totalVariation >= 0 ? '+' : ''}{formatCurrency(totalVariation)}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right tabular-nums">
                  {formatPercent(averageSavingsRate)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 text-right"></td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Best/Worst months analysis */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📈</span>
            Meilleur mois
          </h3>
          <p className="text-sm text-green-800 mb-2">{formatMonthLabel(bestMonth.month)}</p>
          <p className="text-2xl font-bold text-green-600 mb-3">{formatCurrency(bestMonth.endingBalance)}</p>
          <div className="text-xs text-green-700 space-y-1">
            <p>• Flux net: {bestMonth.netFlow >= 0 ? '+' : ''}{formatCurrency(bestMonth.netFlow)}</p>
            <p>• Taux d'épargne: {formatPercent(bestMonth.savingsRate)}</p>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📉</span>
            Pire mois
          </h3>
          <p className="text-sm text-red-800 mb-2">{formatMonthLabel(worstMonth.month)}</p>
          <p className="text-2xl font-bold text-red-600 mb-3">{formatCurrency(worstMonth.endingBalance)}</p>
          <div className="text-xs text-red-700 space-y-1">
            <p>• Flux net: {worstMonth.netFlow >= 0 ? '+' : ''}{formatCurrency(worstMonth.netFlow)}</p>
            <p>• Taux d'épargne: {formatPercent(worstMonth.savingsRate)}</p>
            {worstMonth.burnRate !== null && worstMonth.burnRate > 0 && (
              <p className="font-semibold">• ⚠️ Burn rate: {worstMonth.burnRate.toFixed(1)} mois</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
