'use client';

import React from 'react';
import type { MonthProjection } from '@/lib/types';

interface BalanceProjectionProps {
  projections: MonthProjection[];
}

export const BalanceProjection = ({ projections }: BalanceProjectionProps) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  };

  if (projections.length === 0) {
    return null;
  }

  // Calculate min and max for chart scaling
  const balances = projections.map(p => p.endingBalance);
  const minBalance = Math.min(...balances, 0);
  const maxBalance = Math.max(...balances, 0);
  const range = maxBalance - minBalance;
  const padding = range * 0.1;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Projection de solde</h2>
        <p className="text-sm text-slate-600 mt-1">
          Évolution prévisionnelle de ton solde avec report des excédents/déficits
        </p>
      </div>

      {/* Visual timeline */}
      <div className="mb-6">
        <div className="relative h-48">
          {/* Zero line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-slate-300"
            style={{
              bottom: `${((0 - minBalance + padding) / (range + 2 * padding)) * 100}%`
            }}
          >
            <span className="absolute -left-12 -translate-y-1/2 text-xs text-slate-500">0€</span>
          </div>

          {/* Balance points and connecting line */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {/* Connecting line */}
            <polyline
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              points={projections.map((proj, index) => {
                const x = (index / (projections.length - 1)) * 100;
                const y = 100 - ((proj.endingBalance - minBalance + padding) / (range + 2 * padding)) * 100;
                return `${x},${y}`;
              }).join(' ')}
            />

            {/* Fill area below line */}
            <polygon
              fill="rgba(59, 130, 246, 0.1)"
              points={[
                ...projections.map((proj, index) => {
                  const x = (index / (projections.length - 1)) * 100;
                  const y = 100 - ((proj.endingBalance - minBalance + padding) / (range + 2 * padding)) * 100;
                  return `${x},${y}`;
                }),
                `100,${100 - ((0 - minBalance + padding) / (range + 2 * padding)) * 100}`,
                `0,${100 - ((0 - minBalance + padding) / (range + 2 * padding)) * 100}`,
              ].join(' ')}
            />
          </svg>

          {/* Data points */}
          {projections.map((proj, index) => {
            const x = (index / (projections.length - 1)) * 100;
            const y = 100 - ((proj.endingBalance - minBalance + padding) / (range + 2 * padding)) * 100;
            const isNegative = proj.endingBalance < 0;

            return (
              <div
                key={proj.month}
                className="absolute group"
                style={{
                  left: `${x}%`,
                  bottom: `${y}%`,
                  transform: 'translate(-50%, 50%)',
                }}
              >
                <div
                  className={`
                    w-3 h-3 rounded-full border-2 border-white
                    ${isNegative ? 'bg-red-500' : 'bg-blue-500'}
                    shadow-md cursor-pointer transition-transform hover:scale-150
                  `}
                />

                {/* Tooltip on hover */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                    <p className="font-semibold">{formatMonthLabel(proj.month)}</p>
                    <p className={isNegative ? 'text-red-300' : 'text-green-300'}>
                      {formatCurrency(proj.endingBalance)}
                    </p>
                    {proj.carriedOverDeficit > 0 && (
                      <p className="text-orange-300 text-xs mt-1">
                        Déficit reporté: {formatCurrency(proj.carriedOverDeficit)}
                      </p>
                    )}
                  </div>
                  <div className="w-0 h-0 mx-auto border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Month labels */}
        <div className="flex justify-between mt-4">
          {projections.map((proj) => (
            <div key={proj.month} className="text-xs text-slate-500 text-center flex-1">
              {formatMonthLabel(proj.month)}
            </div>
          ))}
        </div>
      </div>

      {/* Detailed table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mois</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ouverture</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Revenus</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Dépenses</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Charges fixes</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Déficit reporté</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Clôture</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {projections.map((proj, index) => {
              const isNegative = proj.endingBalance < 0;
              const isFirstMonth = index === 0;

              return (
                <tr key={proj.month} className={isFirstMonth ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {formatMonthLabel(proj.month)}
                    {isFirstMonth && <span className="ml-2 text-xs text-blue-600">(actuel)</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">
                    {formatCurrency(proj.openingBalance)}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-600 font-medium text-right">
                    +{formatCurrency(proj.income)}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 font-medium text-right">
                    -{formatCurrency(proj.expenses)}
                  </td>
                  <td className="px-4 py-3 text-sm text-orange-600 font-medium text-right">
                    -{formatCurrency(proj.fixedCharges)}
                  </td>
                  <td className="px-4 py-3 text-sm text-purple-600 font-medium text-right">
                    {proj.carriedOverDeficit > 0 ? `-${formatCurrency(proj.carriedOverDeficit)}` : '—'}
                  </td>
                  <td className={`px-4 py-3 text-sm font-bold text-right ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(proj.endingBalance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Solde initial</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatCurrency(projections[0].openingBalance)}
          </p>
        </div>

        <div className={`rounded-lg border p-4 ${
          projections[projections.length - 1].endingBalance >= 0
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <p className="text-xs font-medium uppercase text-slate-700">
            Solde projeté ({formatMonthLabel(projections[projections.length - 1].month)})
          </p>
          <p className={`mt-2 text-xl font-bold ${
            projections[projections.length - 1].endingBalance >= 0
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {formatCurrency(projections[projections.length - 1].endingBalance)}
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-medium text-blue-700 uppercase">Variation totale</p>
          <p className="mt-2 text-xl font-bold text-blue-600">
            {projections[projections.length - 1].endingBalance - projections[0].openingBalance >= 0 ? '+' : ''}
            {formatCurrency(projections[projections.length - 1].endingBalance - projections[0].openingBalance)}
          </p>
        </div>
      </div>
    </section>
  );
};
