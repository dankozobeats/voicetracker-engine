'use client';

import React, { useState, useMemo } from 'react';
import type { CategoryBudgetResult } from '@/lib/types';
import CategoryBudgetItem from './CategoryBudgetItem';
import Link from 'next/link';

type SortOption = 'category' | 'budget' | 'spent' | 'status';
type FilterOption = 'all' | 'ok' | 'warning' | 'exceeded';
type ViewMode = 'cards' | 'compact';

export const CategoryBudgetsPanel = ({ budgets }: { budgets: CategoryBudgetResult[] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const filteredAndSortedBudgets = useMemo(() => {
    let result = [...budgets];

    // Filter by search
    if (searchQuery.trim()) {
      result = result.filter((b) =>
        b.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterBy !== 'all') {
      result = result.filter((b) => b.status.toLowerCase() === filterBy);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'category':
          return a.category.localeCompare(b.category);
        case 'budget':
          return b.budget - a.budget;
        case 'spent':
          return b.spent - a.spent;
        case 'status': {
          const statusOrder = { EXCEEDED: 0, WARNING: 1, OK: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        default:
          return 0;
      }
    });

    return result;
  }, [budgets, searchQuery, sortBy, filterBy]);

  if (budgets.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun budget mensuel</h3>
          <p className="text-sm text-slate-600 mb-4">
            Créez vos premiers budgets mensuels pour suivre vos dépenses par catégorie.
          </p>
          <Link
            href="/budgets/manage"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Créer un budget
          </Link>
        </div>
      </section>
    );
  }

  const statusCounts = {
    ok: budgets.filter((b) => b.status === 'OK').length,
    warning: budgets.filter((b) => b.status === 'WARNING').length,
    exceeded: budgets.filter((b) => b.status === 'EXCEEDED').length,
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Budgets mensuels</h2>
          <p className="text-sm text-slate-600 mt-1">
            {budgets.length} budget{budgets.length > 1 ? 's' : ''} · {statusCounts.ok} OK · {statusCounts.warning} Attention · {statusCounts.exceeded} Dépassé{statusCounts.exceeded > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/budgets/manage"
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Gérer
        </Link>
      </div>

      {/* Toolbar */}
      <div className="mb-4 space-y-3">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter by status */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setFilterBy('all')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                filterBy === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tout ({budgets.length})
            </button>
            <button
              onClick={() => setFilterBy('ok')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                filterBy === 'ok'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OK ({statusCounts.ok})
            </button>
            <button
              onClick={() => setFilterBy('warning')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                filterBy === 'warning'
                  ? 'bg-white text-orange-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attention ({statusCounts.warning})
            </button>
            <button
              onClick={() => setFilterBy('exceeded')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                filterBy === 'exceeded'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dépassés ({statusCounts.exceeded})
            </button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            <option value="category">Trier par: Catégorie</option>
            <option value="budget">Trier par: Budget</option>
            <option value="spent">Trier par: Dépensé</option>
            <option value="status">Trier par: Statut</option>
          </select>

          {/* View mode toggle */}
          <div className="ml-auto flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vue cartes"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                viewMode === 'compact'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vue compacte"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredAndSortedBudgets.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">Aucun budget ne correspond à votre recherche</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedBudgets.map((budget) => (
            <CategoryBudgetItem key={budget.category} budgetResult={budget} />
          ))}
        </div>
      ) : (
        <CompactBudgetList budgets={filteredAndSortedBudgets} />
      )}
    </section>
  );
};

// Compact list view component
function CompactBudgetList({ budgets }: { budgets: CategoryBudgetResult[] }) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const statusColors = {
    OK: 'bg-green-100 text-green-800',
    WARNING: 'bg-orange-100 text-orange-800',
    EXCEEDED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Catégorie</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Budget</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Charges fixes</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Variables</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Restant</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {budgets.map((budget) => {
            const ratio = budget.budget > 0 ? Math.min((budget.spent / budget.budget) * 100, 100) : 0;
            return (
              <tr key={budget.category} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{budget.category}</td>
                <td className="px-4 py-3 text-sm text-slate-600 text-right">{formatCurrency(budget.budget)}</td>
                <td className="px-4 py-3 text-sm text-orange-600 text-right">{formatCurrency(budget.fixedCharges)}</td>
                <td className="px-4 py-3 text-sm text-blue-600 text-right">{formatCurrency(budget.variableSpent)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">{formatCurrency(budget.spent)}</td>
                <td className={`px-4 py-3 text-sm font-semibold text-right ${budget.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(budget.remaining)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusColors[budget.status]}`}>
                    {Math.round(ratio)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
