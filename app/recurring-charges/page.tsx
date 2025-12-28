'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format';

interface RecurringCharge {
  id: string;
  label: string;
  amount: number;
  account: 'SG' | 'FLOA';
  type: 'INCOME' | 'EXPENSE';
  start_date: string;
  end_date: string | null;
  excluded_months: string[];
  monthly_overrides: Record<string, number>;
}

interface FormData {
  label: string;
  amount: number;
  account: 'SG' | 'FLOA';
  type: 'INCOME' | 'EXPENSE';
  start_date: string;
  end_date: string;
  excluded_months: string[];
  new_excluded_month: string;
  monthly_overrides: Record<string, number>;
  override_month: string;
  override_amount: string;
}

export default function RecurringChargesPage() {
  const [charges, setCharges] = useState<RecurringCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    label: '',
    amount: 0,
    account: 'SG',
    type: 'EXPENSE',
    start_date: new Date().toISOString().split('T')[0].slice(0, 7), // YYYY-MM
    end_date: '',
    excluded_months: [],
    new_excluded_month: '',
    monthly_overrides: {},
    override_month: '',
    override_amount: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterAccount, setFilterAccount] = useState<'ALL' | 'SG' | 'FLOA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuspensionsSummary, setShowSuspensionsSummary] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDateYear, setStartDateYear] = useState(new Date().getFullYear());
  const [endDateYear, setEndDateYear] = useState(new Date().getFullYear());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showExcludedMonthsPicker, setShowExcludedMonthsPicker] = useState(false);

  const fetchCharges = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Vous devez être connecté');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/recurring-charges');

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des charges récurrentes');
      }

      const data = (await response.json()) as { recurringCharges: RecurringCharge[] };
      setCharges(data.recurringCharges || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharges();
  }, []);

  const startEdit = (charge: RecurringCharge) => {
    setEditingId(charge.id);
    setFormData({
      label: charge.label,
      amount: charge.amount,
      account: charge.account,
      type: charge.type,
      start_date: charge.start_date,
      end_date: charge.end_date || '',
      excluded_months: charge.excluded_months || [],
      new_excluded_month: '',
      monthly_overrides: charge.monthly_overrides || {},
      override_month: '',
      override_amount: '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      label: '',
      amount: 0,
      account: 'SG',
      type: 'EXPENSE',
      start_date: new Date().toISOString().split('T')[0].slice(0, 7),
      end_date: '',
      excluded_months: [],
      new_excluded_month: '',
      monthly_overrides: {},
      override_month: '',
      override_amount: '',
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/recurring-charges?id=${editingId}`
        : '/api/recurring-charges';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: formData.label,
          amount: formData.amount,
          account: formData.account,
          type: formData.type,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          excluded_months: formData.excluded_months,
          monthly_overrides: formData.monthly_overrides,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Erreur lors de la sauvegarde');
      }

      // Réinitialiser le formulaire et recharger les données
      setFormData({
        label: '',
        amount: 0,
        account: 'SG',
        type: 'EXPENSE',
        start_date: new Date().toISOString().split('T')[0].slice(0, 7),
        end_date: '',
        excluded_months: [],
        new_excluded_month: '',
        monthly_overrides: {},
        override_month: '',
        override_amount: '',
      });
      setEditingId(null);
      setShowForm(false);
      await fetchCharges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette charge récurrente ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/recurring-charges?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await fetchCharges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const removeExcludedMonth = (month: string) => {
    setFormData({
      ...formData,
      excluded_months: formData.excluded_months.filter((m) => m !== month),
    });
  };

  const handleMonthClick = (month: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const yearMonth = `${selectedYear}-${monthStr}`;

    if (formData.excluded_months.includes(yearMonth)) {
      // Si le mois est déjà exclu, on le retire
      setFormData({
        ...formData,
        excluded_months: formData.excluded_months.filter((m) => m !== yearMonth),
      });
    } else {
      // Sinon on l'ajoute
      setFormData({
        ...formData,
        excluded_months: [...formData.excluded_months, yearMonth].sort(),
      });
    }
  };

  const handleStartDateClick = (month: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const yearMonth = `${startDateYear}-${monthStr}`;
    setFormData({ ...formData, start_date: yearMonth });
  };

  const handleEndDateClick = (month: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const yearMonth = `${endDateYear}-${monthStr}`;
    setFormData({ ...formData, end_date: yearMonth });
  };

  const clearEndDate = () => {
    setFormData({ ...formData, end_date: '' });
  };

  const addMonthlyOverride = () => {
    if (!formData.override_month || !formData.override_amount) return;

    const amount = parseFloat(formData.override_amount);
    if (isNaN(amount) || amount <= 0) return;

    setFormData({
      ...formData,
      monthly_overrides: {
        ...formData.monthly_overrides,
        [formData.override_month]: amount,
      },
      override_month: '',
      override_amount: '',
    });
  };

  const removeMonthlyOverride = (month: string) => {
    const { [month]: _, ...rest } = formData.monthly_overrides;
    setFormData({
      ...formData,
      monthly_overrides: rest,
    });
  };

  // Filtrer les charges
  const filteredCharges = charges.filter((charge) => {
    if (filterType !== 'ALL' && charge.type !== filterType) return false;
    if (filterAccount !== 'ALL' && charge.account !== filterAccount) return false;
    if (searchQuery && !charge.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Calculer les statistiques
  const stats = {
    total: filteredCharges.length,
    income: filteredCharges.filter((c) => c.type === 'INCOME').length,
    expense: filteredCharges.filter((c) => c.type === 'EXPENSE').length,
    totalIncome: filteredCharges
      .filter((c) => c.type === 'INCOME')
      .reduce((sum, c) => sum + c.amount, 0),
    totalExpense: filteredCharges
      .filter((c) => c.type === 'EXPENSE')
      .reduce((sum, c) => sum + c.amount, 0),
    sg: filteredCharges.filter((c) => c.account === 'SG').length,
    floa: filteredCharges.filter((c) => c.account === 'FLOA').length,
  };

  // Récapitulatif des suspensions
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonth = getCurrentMonth();

  const suspendedCharges = charges
    .filter((charge) => charge.excluded_months && charge.excluded_months.length > 0)
    .map((charge) => {
      const sortedExcludedMonths = [...(charge.excluded_months || [])].sort();
      const currentlySuspended = sortedExcludedMonths.includes(currentMonth);

      // Trouver le prochain mois de reprise (le premier mois après aujourd'hui qui n'est pas exclu)
      let resumeMonth: string | null = null;
      if (currentlySuspended) {
        // Chercher le mois suivant qui n'est pas exclu
        const date = new Date(currentMonth + '-01');
        for (let i = 1; i <= 12; i++) {
          date.setMonth(date.getMonth() + 1);
          const nextMonth = date.toISOString().slice(0, 7);
          if (!sortedExcludedMonths.includes(nextMonth)) {
            // Vérifier aussi si c'est avant end_date
            if (!charge.end_date || nextMonth <= charge.end_date) {
              resumeMonth = nextMonth;
              break;
            }
          }
        }
      }

      return {
        ...charge,
        currentlySuspended,
        resumeMonth,
        sortedExcludedMonths,
      };
    });

  if (loading) {
    return (
      <main className="page-shell">
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-600">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Charges récurrentes</h1>
            <p className="mt-2 text-slate-600">
              Gérez vos revenus et charges fixes mensuelles (salaire, loyer, abonnements, etc.)
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? 'Annuler' : 'Ajouter'}
          </button>
        </header>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        {/* Panneau de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-600">
              {stats.income} revenus · {stats.expense} dépenses
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-green-700">Revenus mensuels</p>
            <p className="mt-2 text-2xl font-bold text-green-600">+{formatCurrency(stats.totalIncome)}</p>
            <p className="mt-1 text-xs text-green-600">{stats.income} charge(s)</p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-red-700">Charges mensuelles</p>
            <p className="mt-2 text-2xl font-bold text-red-600">-{formatCurrency(stats.totalExpense)}</p>
            <p className="mt-1 text-xs text-red-600">{stats.expense} charge(s)</p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-700">Solde mensuel</p>
            <p className={`mt-2 text-2xl font-bold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {stats.totalIncome - stats.totalExpense >= 0 ? '+' : ''}{formatCurrency(stats.totalIncome - stats.totalExpense)}
            </p>
            <p className="mt-1 text-xs text-blue-600">
              SG: {stats.sg} · FLOA: {stats.floa}
            </p>
          </div>
        </div>

        {/* Récapitulatif des suspensions - Collapsible */}
        {suspendedCharges.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50">
            <button
              onClick={() => setShowSuspensionsSummary(!showSuspensionsSummary)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-amber-900">
                  Charges avec suspensions ({suspendedCharges.length})
                </h3>
                {suspendedCharges.some(c => c.currentlySuspended) && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {suspendedCharges.filter(c => c.currentlySuspended).length} suspendue(s) ce mois
                  </span>
                )}
              </div>
              <svg
                className={`h-5 w-5 text-amber-700 transition-transform ${showSuspensionsSummary ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSuspensionsSummary && (
              <div className="border-t border-amber-200 p-4 space-y-2">
                {suspendedCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-start justify-between rounded-md bg-white p-3 text-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{charge.label}</span>
                        {charge.currentlySuspended ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Suspendu ce mois-ci
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Actif ce mois-ci
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        <span className="font-medium">{formatCurrency(charge.amount)}/mois</span>
                        <span className="mx-2">·</span>
                        <span>{charge.account}</span>
                        {charge.currentlySuspended && charge.resumeMonth && (
                          <>
                            <span className="mx-2">·</span>
                            <span className="text-amber-700 font-medium">
                              Reprise:{' '}
                              {new Date(charge.resumeMonth + '-01').toLocaleDateString('fr-FR', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs text-slate-500">Mois exclus:</span>
                        {charge.sortedExcludedMonths.map((month) => (
                          <span
                            key={month}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              month === currentMonth
                                ? 'bg-red-100 text-red-800'
                                : month < currentMonth
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {new Date(month + '-01').toLocaleDateString('fr-FR', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filtres */}
        {charges.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="search-query" className="block text-xs font-medium text-slate-700 mb-1">
                  Rechercher
                </label>
                <input
                  type="text"
                  id="search-query"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par libellé..."
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                />
              </div>

              <div>
                <label htmlFor="filter-type" className="block text-xs font-medium text-slate-700 mb-1">
                  Type
                </label>
                <select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                >
                  <option value="ALL">Tous</option>
                  <option value="INCOME">Revenus</option>
                  <option value="EXPENSE">Dépenses</option>
                </select>
              </div>

              <div>
                <label htmlFor="filter-account" className="block text-xs font-medium text-slate-700 mb-1">
                  Compte
                </label>
                <select
                  id="filter-account"
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value as 'ALL' | 'SG' | 'FLOA')}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                >
                  <option value="ALL">Tous</option>
                  <option value="SG">SG</option>
                  <option value="FLOA">FLOA</option>
                </select>
              </div>

              {(filterType !== 'ALL' || filterAccount !== 'ALL' || searchQuery !== '') && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilterType('ALL');
                      setFilterAccount('ALL');
                      setSearchQuery('');
                    }}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? 'Modifier la charge récurrente' : 'Nouvelle charge récurrente'}
            </h2>

            <div>
              <label htmlFor="label" className="block text-sm font-medium text-slate-700">
                Libellé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="label"
                required
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                placeholder="Ex: Salaire, Loyer, Netflix..."
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-700">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
              >
                <option value="EXPENSE">Dépense (Loyer, abonnements...)</option>
                <option value="INCOME">Revenu (Salaire, revenus...)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
                  Montant <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount === 0 ? '' : formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                />
              </div>

              <div>
                <label htmlFor="account" className="block text-sm font-medium text-slate-700">
                  Compte <span className="text-red-500">*</span>
                </label>
                <select
                  id="account"
                  required
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value as 'SG' | 'FLOA' })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                >
                  <option value="SG">SG</option>
                  <option value="FLOA">FLOA</option>
                </select>
              </div>
            </div>

            {/* Période et suspensions - Section regroupée */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Période et suspensions</h3>

              {/* Date de début */}
              <div className="bg-slate-50 rounded-lg p-3">
                <button
                  type="button"
                  onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                  className="w-full flex items-center justify-between hover:text-slate-900"
                >
                  <span className="text-sm font-medium text-slate-700">
                    Date de début <span className="text-red-500">*</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {formData.start_date && (
                      <span className="text-sm text-slate-600">
                        {new Date(formData.start_date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    <svg
                      className={`h-4 w-4 transition-transform ${showStartDatePicker ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showStartDatePicker && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-center gap-3 py-1">
                      <button
                        type="button"
                        onClick={() => setStartDateYear(startDateYear - 1)}
                        className="rounded p-1 hover:bg-slate-200 text-slate-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm font-semibold text-slate-900 min-w-[60px] text-center">{startDateYear}</span>
                      <button
                        type="button"
                        onClick={() => setStartDateYear(startDateYear + 1)}
                        className="rounded p-1 hover:bg-slate-200 text-slate-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((monthName, index) => {
                        const monthStr = String(index + 1).padStart(2, '0');
                        const yearMonth = `${startDateYear}-${monthStr}`;
                        const isSelected = formData.start_date === yearMonth;

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleStartDateClick(index)}
                            className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                              isSelected
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {monthName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Date de fin */}
              <div className="bg-slate-50 rounded-lg p-3">
                <button
                  type="button"
                  onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                  className="w-full flex items-center justify-between hover:text-slate-900"
                >
                  <span className="text-sm font-medium text-slate-700">Date de fin (optionnel)</span>
                  <div className="flex items-center gap-2">
                    {formData.end_date && (
                      <>
                        <span className="text-sm text-slate-600">
                          {new Date(formData.end_date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearEndDate();
                          }}
                          className="text-xs text-red-600 hover:text-red-700 px-1"
                        >
                          ✕
                        </button>
                      </>
                    )}
                    <svg
                      className={`h-4 w-4 transition-transform ${showEndDatePicker ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showEndDatePicker && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-center gap-3 py-1">
                      <button
                        type="button"
                        onClick={() => setEndDateYear(endDateYear - 1)}
                        className="rounded p-1 hover:bg-slate-200 text-slate-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm font-semibold text-slate-900 min-w-[60px] text-center">{endDateYear}</span>
                      <button
                        type="button"
                        onClick={() => setEndDateYear(endDateYear + 1)}
                        className="rounded p-1 hover:bg-slate-200 text-slate-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((monthName, index) => {
                        const monthStr = String(index + 1).padStart(2, '0');
                        const yearMonth = `${endDateYear}-${monthStr}`;
                        const isSelected = formData.end_date === yearMonth;

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleEndDateClick(index)}
                            className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                              isSelected
                                ? 'bg-green-500 text-white shadow-sm'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {monthName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Mois suspendus */}
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <button
                  type="button"
                  onClick={() => setShowExcludedMonthsPicker(!showExcludedMonthsPicker)}
                  className="w-full flex items-center justify-between hover:text-slate-900"
                >
                  <span className="text-sm font-medium text-slate-700">Suspendre certains mois</span>
                  <div className="flex items-center gap-2">
                    {formData.excluded_months.length > 0 && (
                      <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-medium">
                        {formData.excluded_months.length}
                      </span>
                    )}
                    <svg
                      className={`h-4 w-4 transition-transform ${showExcludedMonthsPicker ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {formData.excluded_months.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.excluded_months.map((month) => (
                      <span
                        key={month}
                        className="inline-flex items-center gap-1 rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900"
                      >
                        {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                        <button
                          type="button"
                          onClick={() => removeExcludedMonth(month)}
                          className="hover:text-amber-950"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {showExcludedMonthsPicker && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-amber-800">Cliquez sur les mois à suspendre</p>

                    <div className="flex items-center justify-center gap-3 py-1">
                      <button
                        type="button"
                        onClick={() => setSelectedYear(selectedYear - 1)}
                        className="rounded p-1 hover:bg-amber-100 text-slate-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm font-semibold text-slate-900 min-w-[60px] text-center">{selectedYear}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedYear(selectedYear + 1)}
                        className="rounded p-1 hover:bg-amber-100 text-slate-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((monthName, index) => {
                        const monthStr = String(index + 1).padStart(2, '0');
                        const yearMonth = `${selectedYear}-${monthStr}`;
                        const isExcluded = formData.excluded_months.includes(yearMonth);

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleMonthClick(index)}
                            className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                              isExcluded
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-white border border-amber-300 text-slate-700 hover:bg-amber-100'
                            }`}
                          >
                            {monthName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Montants variables par mois */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Montants variables (optionnel)</span>
                  {Object.keys(formData.monthly_overrides).length > 0 && (
                    <span className="text-xs bg-green-200 text-green-900 px-2 py-0.5 rounded-full font-medium">
                      {Object.keys(formData.monthly_overrides).length}
                    </span>
                  )}
                </div>

                <p className="text-xs text-green-800 mb-3">
                  Définir des montants différents pour certains mois (ex: prime de fin d'année, facture variable)
                </p>

                {Object.keys(formData.monthly_overrides).length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {Object.entries(formData.monthly_overrides)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([month, amount]) => (
                        <span
                          key={month}
                          className="inline-flex items-center gap-1 rounded bg-green-200 px-2 py-1 text-xs font-medium text-green-900"
                        >
                          {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}:{' '}
                          {formatCurrency(amount)}
                          <button
                            type="button"
                            onClick={() => removeMonthlyOverride(month)}
                            className="hover:text-green-950 ml-1"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="month"
                    value={formData.override_month}
                    onChange={(e) => setFormData({ ...formData, override_month: e.target.value })}
                    className="flex-1 rounded border border-green-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                    placeholder="Mois"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.override_amount}
                    onChange={(e) => setFormData({ ...formData, override_amount: e.target.value })}
                    className="w-32 rounded border border-green-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                    placeholder="Montant"
                  />
                  <button
                    type="button"
                    onClick={addMonthlyOverride}
                    disabled={!formData.override_month || !formData.override_amount}
                    className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}

        {charges.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Aucun revenu ou charge récurrente défini.</p>
          </div>
        ) : filteredCharges.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Aucune charge ne correspond aux filtres sélectionnés.</p>
            <button
              onClick={() => {
                setFilterType('ALL');
                setFilterAccount('ALL');
              }}
              className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCharges.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{charge.label}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      charge.type === 'INCOME'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {charge.type === 'INCOME' ? 'Revenu' : 'Dépense'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="font-medium">{formatCurrency(charge.amount)} / mois</span>
                    <span>Compte: {charge.account}</span>
                    <span>
                      Depuis: {new Date(charge.start_date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </span>
                    {charge.end_date && (
                      <span>
                        Jusqu&apos;à: {new Date(charge.end_date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {charge.excluded_months && charge.excluded_months.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-xs text-slate-500">·</span>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {charge.excluded_months.length} mois suspendu{charge.excluded_months.length > 1 ? 's' : ''}
                        </span>
                        {charge.excluded_months.includes(currentMonth) && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            dont ce mois-ci
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(charge)}
                    className="rounded-md px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(charge.id)}
                    className="rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
