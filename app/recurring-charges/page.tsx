'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format';

interface Reminder {
  id: string;
  month: string;
  note: string;
  dismissed: boolean;
}

interface RecurringCharge {
  id: string;
  label: string;
  amount: number;
  account: 'SG' | 'FLOA';
  type: 'INCOME' | 'EXPENSE';
  purpose: 'REGULAR' | 'SAVINGS' | 'EMERGENCY' | 'HEALTH' | 'DEBT';
  start_date: string;
  end_date: string | null;
  excluded_months: string[];
  monthly_overrides: Record<string, number>;
  reminders: Reminder[];
  // Debt fields
  initial_balance?: number | null;
  remaining_balance?: number | null;
  interest_rate?: number | null;
  debt_start_date?: string | null;
}

interface FormData {
  label: string;
  amount: number;
  account: 'SG' | 'FLOA';
  type: 'INCOME' | 'EXPENSE';
  purpose: 'REGULAR' | 'SAVINGS' | 'EMERGENCY' | 'HEALTH' | 'DEBT';
  start_date: string;
  end_date: string;
  excluded_months: string[];
  new_excluded_month: string;
  monthly_overrides: Record<string, number>;
  override_month: string;
  override_amount: string;
  reminders: Reminder[];
  reminder_month: string;
  reminder_note: string;
  // Debt fields
  initial_balance: string;
  remaining_balance: string;
  interest_rate: string;
  debt_start_date: string;
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
    purpose: 'REGULAR',
    start_date: new Date().toISOString().split('T')[0].slice(0, 7), // YYYY-MM
    end_date: '',
    excluded_months: [],
    new_excluded_month: '',
    monthly_overrides: {},
    override_month: '',
    override_amount: '',
    reminders: [],
    reminder_month: '',
    reminder_note: '',
    // Debt fields
    initial_balance: '',
    remaining_balance: '',
    interest_rate: '',
    debt_start_date: '',
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
  const [showMonthlyOverridesSection, setShowMonthlyOverridesSection] = useState(false);
  const [showRemindersSection, setShowRemindersSection] = useState(false);
  const [overrideYear, setOverrideYear] = useState(new Date().getFullYear());
  const [reminderYear, setReminderYear] = useState(new Date().getFullYear());
  const [expandedCharges, setExpandedCharges] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'label' | 'amount'>('label');
  const [groupByType, setGroupByType] = useState(true);
  const [showIncome, setShowIncome] = useState(true);
  const [showExpense, setShowExpense] = useState(true);
  const [showProjection, setShowProjection] = useState(false);

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
      purpose: charge.purpose || 'REGULAR',
      start_date: charge.start_date,
      end_date: charge.end_date || '',
      excluded_months: charge.excluded_months || [],
      new_excluded_month: '',
      monthly_overrides: charge.monthly_overrides || {},
      override_month: '',
      override_amount: '',
      reminders: charge.reminders || [],
      reminder_month: '',
      reminder_note: '',
      // Debt fields
      initial_balance: charge.initial_balance?.toString() || '',
      remaining_balance: charge.remaining_balance?.toString() || '',
      interest_rate: charge.interest_rate?.toString() || '',
      debt_start_date: charge.debt_start_date || '',
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
      purpose: 'REGULAR',
      start_date: new Date().toISOString().split('T')[0].slice(0, 7),
      end_date: '',
      excluded_months: [],
      new_excluded_month: '',
      monthly_overrides: {},
      override_month: '',
      override_amount: '',
      reminders: [],
      reminder_month: '',
      reminder_note: '',
      // Debt fields
      initial_balance: '',
      remaining_balance: '',
      interest_rate: '',
      debt_start_date: '',
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
          purpose: formData.purpose,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          excluded_months: formData.excluded_months,
          monthly_overrides: formData.monthly_overrides,
          reminders: formData.reminders,
          // Debt fields (only if purpose is DEBT)
          initial_balance: formData.initial_balance || null,
          remaining_balance: formData.remaining_balance || null,
          interest_rate: formData.interest_rate || null,
          debt_start_date: formData.debt_start_date || null,
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
        purpose: 'REGULAR',
        start_date: new Date().toISOString().split('T')[0].slice(0, 7),
        end_date: '',
        excluded_months: [],
        new_excluded_month: '',
        monthly_overrides: {},
        override_month: '',
        override_amount: '',
        reminders: [],
        reminder_month: '',
        reminder_note: '',
        // Debt fields
        initial_balance: '',
        remaining_balance: '',
        interest_rate: '',
        debt_start_date: '',
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

    // Apply cumulative override logic: propagate to all future months
    const newOverrides = { ...formData.monthly_overrides };
    const overrideMonth = formData.override_month;

    // Calculate end month (either end_date or 12 months from override)
    const endMonth = formData.end_date || (() => {
      const date = new Date(overrideMonth + '-01');
      date.setMonth(date.getMonth() + 12);
      return date.toISOString().slice(0, 7);
    })();

    // Set override for selected month and all future months until end
    let currentMonth = overrideMonth;
    while (currentMonth <= endMonth) {
      // Only set if no future override exists for this month
      if (!(currentMonth in newOverrides) || currentMonth === overrideMonth) {
        newOverrides[currentMonth] = amount;
      } else {
        // Stop propagating when we hit a future override
        break;
      }

      const date = new Date(currentMonth + '-01');
      date.setMonth(date.getMonth() + 1);
      currentMonth = date.toISOString().slice(0, 7);
    }

    setFormData({
      ...formData,
      monthly_overrides: newOverrides,
      override_month: '',
      override_amount: '',
    });
  };

  const removeMonthlyOverride = (month: string) => {
    const newOverrides = { ...formData.monthly_overrides };
    delete newOverrides[month];

    // Find the previous override to propagate forward from this month
    const sortedOverrides = Object.entries(newOverrides)
      .sort(([a], [b]) => a.localeCompare(b));

    // Find previous override before deleted month
    let previousAmount = formData.amount; // Default to base amount
    for (const [overrideMonth, overrideAmount] of sortedOverrides) {
      if (overrideMonth < month) {
        previousAmount = overrideAmount;
      }
    }

    // Find next override after deleted month
    let nextOverrideMonth: string | null = null;
    for (const [overrideMonth] of sortedOverrides) {
      if (overrideMonth > month) {
        nextOverrideMonth = overrideMonth;
        break;
      }
    }

    // Propagate previous amount from deleted month to next override (or end)
    const endMonth = nextOverrideMonth || formData.end_date || (() => {
      const date = new Date(month + '-01');
      date.setMonth(date.getMonth() + 12);
      return date.toISOString().slice(0, 7);
    })();

    let currentMonth = month;
    while (currentMonth < endMonth && (!nextOverrideMonth || currentMonth < nextOverrideMonth)) {
      if (previousAmount !== formData.amount) {
        // Only set if different from base amount
        newOverrides[currentMonth] = previousAmount;
      } else {
        // Remove if same as base amount
        delete newOverrides[currentMonth];
      }

      const date = new Date(currentMonth + '-01');
      date.setMonth(date.getMonth() + 1);
      currentMonth = date.toISOString().slice(0, 7);
    }

    setFormData({
      ...formData,
      monthly_overrides: newOverrides,
    });
  };

  const addReminder = () => {
    if (!formData.reminder_month || !formData.reminder_note.trim()) return;

    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      month: formData.reminder_month,
      note: formData.reminder_note.trim(),
      dismissed: false,
    };

    setFormData({
      ...formData,
      reminders: [...formData.reminders, newReminder].sort((a, b) => a.month.localeCompare(b.month)),
      reminder_month: '',
      reminder_note: '',
    });
  };

  const removeReminder = (id: string) => {
    setFormData({
      ...formData,
      reminders: formData.reminders.filter((r) => r.id !== id),
    });
  };

  const dismissReminder = (id: string) => {
    setFormData({
      ...formData,
      reminders: formData.reminders.map((r) => (r.id === id ? { ...r, dismissed: true } : r)),
    });
  };

  const handleOverrideMonthClick = (month: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const yearMonth = `${overrideYear}-${monthStr}`;
    setFormData({ ...formData, override_month: yearMonth });
  };

  const handleReminderMonthClick = (month: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const yearMonth = `${reminderYear}-${monthStr}`;
    setFormData({ ...formData, reminder_month: yearMonth });
  };

  // Filtrer les charges
  const filteredCharges = charges.filter((charge) => {
    if (filterType !== 'ALL' && charge.type !== filterType) return false;
    if (filterAccount !== 'ALL' && charge.account !== filterAccount) return false;
    if (searchQuery && !charge.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Exclure les dettes des charges récurrentes (elles ont leur propre page /debts)
  const chargesWithoutDebts = filteredCharges.filter((c) => c.purpose !== 'DEBT');

  // Trier les charges
  const sortedCharges = [...chargesWithoutDebts].sort((a, b) => {
    if (sortBy === 'amount') {
      return b.amount - a.amount; // Décroissant
    }
    return a.label.localeCompare(b.label); // Alphabétique
  });

  // Grouper par type si activé
  const groupedCharges = groupByType
    ? {
        INCOME: sortedCharges.filter((c) => c.type === 'INCOME'),
        EXPENSE: sortedCharges.filter((c) => c.type === 'EXPENSE'),
      }
    : { ALL: sortedCharges };

  // Calculer les statistiques
  const stats = {
    total: chargesWithoutDebts.length,
    income: chargesWithoutDebts.filter((c) => c.type === 'INCOME').length,
    expense: chargesWithoutDebts.filter((c) => c.type === 'EXPENSE').length,
    totalIncome: chargesWithoutDebts
      .filter((c) => c.type === 'INCOME')
      .reduce((sum, c) => sum + c.amount, 0),
    totalExpense: chargesWithoutDebts
      .filter((c) => c.type === 'EXPENSE')
      .reduce((sum, c) => sum + c.amount, 0),
    sg: chargesWithoutDebts.filter((c) => c.account === 'SG').length,
    floa: chargesWithoutDebts.filter((c) => c.account === 'FLOA').length,
  };

  // Récapitulatif des suspensions et rappels
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonth = getCurrentMonth();

  // Fonction de rendu pour une carte de charge
  const renderChargeCard = (charge: RecurringCharge) => {
    const isExpanded = expandedCharges.has(charge.id);
    const hasDetails =
      Object.keys(charge.monthly_overrides).length > 0 ||
      (charge.excluded_months && charge.excluded_months.length > 0) ||
      (charge.reminders && charge.reminders.filter((r) => !r.dismissed).length > 0);

    return (
      <div
        key={charge.id}
        className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
      >
        {/* Header - Always visible */}
        <div className="flex items-start justify-between">
          <div
            className="flex-1 cursor-pointer"
            onClick={() => {
              const newExpanded = new Set(expandedCharges);
              if (isExpanded) {
                newExpanded.delete(charge.id);
              } else {
                newExpanded.add(charge.id);
              }
              setExpandedCharges(newExpanded);
            }}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-slate-900">{charge.label}</h3>
              {!groupByType && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  charge.type === 'INCOME'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {charge.type === 'INCOME' ? 'Revenu' : 'Dépense'}
                </span>
              )}
              <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
                {charge.account}
              </span>
              {charge.purpose && charge.purpose !== 'REGULAR' && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  charge.purpose === 'SAVINGS'
                    ? 'bg-green-100 text-green-800'
                    : charge.purpose === 'EMERGENCY'
                    ? 'bg-amber-100 text-amber-800'
                    : charge.purpose === 'HEALTH'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {charge.purpose === 'SAVINGS' && '💰 Épargne'}
                  {charge.purpose === 'EMERGENCY' && '⚠️ Imprévus'}
                  {charge.purpose === 'HEALTH' && '🏥 Santé'}
                </span>
              )}
              {hasDetails && (
                <button
                  className="ml-2 text-slate-400 hover:text-slate-600 transition-transform"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatCurrency(charge.amount)} / mois
            </div>
            {/* Quick summary - always visible */}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="text-slate-600">
                {new Date(charge.start_date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                {charge.end_date && <> → {new Date(charge.end_date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</>}
              </span>
              {charge.excluded_months && charge.excluded_months.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                  {charge.excluded_months.length} suspension{charge.excluded_months.length > 1 ? 's' : ''}
                </span>
              )}
              {charge.reminders && charge.reminders.filter((r) => !r.dismissed).length > 0 && (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-800">
                  {charge.reminders.filter((r) => !r.dismissed).length} rappel{charge.reminders.filter((r) => !r.dismissed).length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Mini-Timeline - Visual 12-month forecast */}
            {(() => {
              const today = new Date();
              const timeline = [];

              for (let i = 0; i < 12; i++) {
                const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
                const monthStr = date.toISOString().slice(0, 7);

                const isBeforeStart = charge.start_date && monthStr < charge.start_date;
                const isAfterEnd = charge.end_date && monthStr > charge.end_date;
                const isOutOfPeriod = isBeforeStart || isAfterEnd;
                const isExcluded = charge.excluded_months?.includes(monthStr);
                const hasReminder = charge.reminders?.some((r) => !r.dismissed && r.month === monthStr);

                let effectiveAmount = charge.amount;
                let isOverride = false;

                if (charge.monthly_overrides) {
                  const sortedOverrides = Object.entries(charge.monthly_overrides)
                    .sort(([a], [b]) => a.localeCompare(b));

                  for (const [overrideMonth, overrideAmount] of sortedOverrides) {
                    if (overrideMonth <= monthStr) {
                      effectiveAmount = overrideAmount;
                      isOverride = overrideMonth === monthStr;
                    }
                  }
                }

                timeline.push({
                  month: monthStr,
                  monthName: date.toLocaleDateString('fr-FR', { month: 'short' }),
                  amount: effectiveAmount,
                  isExcluded,
                  isOverride,
                  hasReminder,
                  isOutOfPeriod,
                });
              }

              return (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newExpanded = new Set(expandedCharges);
                      if (isExpanded) {
                        newExpanded.delete(charge.id);
                      } else {
                        newExpanded.add(charge.id);
                      }
                      setExpandedCharges(newExpanded);
                    }}
                    className="w-full flex items-center justify-between text-left mb-2 hover:opacity-70"
                  >
                    <span className="text-[10px] font-medium text-slate-500">Calendrier prévisionnel (12 mois)</span>
                    <svg
                      className={`h-3 w-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-6 gap-1">
                      {timeline.map(({ month, monthName, amount, isExcluded, isOverride, hasReminder, isOutOfPeriod }) => (
                        <div
                          key={month}
                          className="relative group"
                          title={`${monthName}: ${isOutOfPeriod ? 'Hors période' : isExcluded ? 'Suspendu' : formatCurrency(amount)}${isOverride ? ' (override)' : ''}${hasReminder ? ' [Rappel]' : ''}`}
                        >
                          <div className="text-[9px] text-center text-slate-500 mb-0.5 uppercase">
                            {monthName}
                          </div>
                          <div
                            className={`h-8 rounded text-[10px] font-semibold flex items-center justify-center relative ${
                              isOutOfPeriod
                                ? 'bg-slate-100 text-slate-400'
                                : isExcluded
                                ? 'bg-amber-200 text-amber-900 line-through'
                                : isOverride
                                ? 'bg-green-500 text-white shadow-sm'
                                : 'bg-green-100 text-green-900'
                            }`}
                          >
                            {isOutOfPeriod ? '—' : isExcluded ? '—' : `${Math.round(amount)}€`}
                            {hasReminder && !isExcluded && !isOutOfPeriod && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border border-white" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
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

        {/* Expanded details */}
        {isExpanded && (
          <>
            {/* Période */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {new Date(charge.start_date + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                {charge.end_date && (
                  <> → {new Date(charge.end_date + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</>
                )}
                {!charge.end_date && <> → Indéterminé</>}
              </span>
            </div>

            {/* Montants variables */}
            {Object.keys(charge.monthly_overrides).length > 0 && (
              <div className="bg-green-50 rounded p-3 border border-green-200">
                <div className="text-xs font-medium text-green-900 mb-2 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Montants variables ({Object.keys(charge.monthly_overrides).length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(charge.monthly_overrides)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, amount]) => (
                      <span
                        key={month}
                        className="inline-flex items-center gap-1.5 rounded bg-green-200 px-2 py-1 text-xs font-medium text-green-900"
                      >
                        {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                        <span className="font-semibold">{formatCurrency(amount)}</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Mois suspendus */}
            {charge.excluded_months && charge.excluded_months.length > 0 && (
              <div className="bg-amber-50 rounded p-3 border border-amber-200">
                <div className="text-xs font-medium text-amber-900 mb-2 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mois suspendus ({charge.excluded_months.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {charge.excluded_months
                    .sort((a, b) => a.localeCompare(b))
                    .map((month) => (
                      <span
                        key={month}
                        className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                          month === currentMonth
                            ? 'bg-red-200 text-red-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Rappels */}
            {charge.reminders && charge.reminders.filter((r) => !r.dismissed).length > 0 && (
              <div className="bg-orange-50 rounded p-3 border border-orange-200">
                <div className="text-xs font-medium text-orange-900 mb-2 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Rappels ({charge.reminders.filter((r) => !r.dismissed).length})
                </div>
                <div className="space-y-1.5">
                  {charge.reminders
                    .filter((r) => !r.dismissed)
                    .sort((a, b) => a.month.localeCompare(b.month))
                    .map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`rounded px-2 py-1.5 text-xs ${
                          reminder.month === currentMonth
                            ? 'bg-orange-200 text-orange-900 font-medium'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        <span className="font-medium">
                          {new Date(reminder.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}:
                        </span>{' '}
                        {reminder.note}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Collecter tous les rappels actifs pour ce mois
  const activeReminders = charges
    .filter((charge) => charge.reminders && charge.reminders.length > 0)
    .flatMap((charge) =>
      charge.reminders
        .filter((reminder) => !reminder.dismissed && reminder.month === currentMonth)
        .map((reminder) => ({
          ...reminder,
          chargeId: charge.id,
          chargeLabel: charge.label,
        }))
    )
    .sort((a, b) => a.chargeLabel.localeCompare(b.chargeLabel));

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
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 lg:space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Charges récurrentes</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600">
              Gérez vos revenus et charges fixes mensuelles (salaire, loyer, abonnements, etc.)
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 whitespace-nowrap"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total</p>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-600">
              {stats.income} revenus · {stats.expense} dépenses
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-green-700">Revenus mensuels</p>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-green-600">+{formatCurrency(stats.totalIncome)}</p>
            <p className="mt-1 text-xs text-green-600">{stats.income} charge(s)</p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-red-700">Charges mensuelles</p>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-red-600">-{formatCurrency(stats.totalExpense)}</p>
            <p className="mt-1 text-xs text-red-600">{stats.expense} charge(s)</p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-700">Solde mensuel</p>
            <p className={`mt-1 sm:mt-2 text-xl sm:text-2xl font-bold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {stats.totalIncome - stats.totalExpense >= 0 ? '+' : ''}{formatCurrency(stats.totalIncome - stats.totalExpense)}
            </p>
            <p className="mt-1 text-xs text-blue-600">
              SG: {stats.sg} · FLOA: {stats.floa}
            </p>
          </div>
        </div>

        {/* Panneau récapitulatif des provisions et épargnes */}
        {(() => {
          // Fonction helper pour calculer le montant réel d'une charge pour le mois actuel
          const getAmountForCurrentMonth = (charge: RecurringCharge): number => {
            // Vérifier si le mois est exclu (suspendu)
            if (charge.excluded_months && charge.excluded_months.includes(currentMonth)) {
              return 0;
            }

            // Vérifier s'il y a un override pour ce mois
            if (charge.monthly_overrides && charge.monthly_overrides[currentMonth] !== undefined) {
              return charge.monthly_overrides[currentMonth];
            }

            // Retourner le montant de base
            return charge.amount;
          };

          const savingsCharges = chargesWithoutDebts.filter((c) => c.purpose === 'SAVINGS' && c.type === 'EXPENSE');
          const emergencyCharges = chargesWithoutDebts.filter((c) => c.purpose === 'EMERGENCY' && c.type === 'EXPENSE');
          const healthCharges = chargesWithoutDebts.filter((c) => c.purpose === 'HEALTH' && c.type === 'EXPENSE');

          // Calculer les totaux en tenant compte des suspensions et overrides pour le mois actuel
          const totalSavings = savingsCharges.reduce((sum, c) => sum + getAmountForCurrentMonth(c), 0);
          const totalEmergency = emergencyCharges.reduce((sum, c) => sum + getAmountForCurrentMonth(c), 0);
          const totalHealth = healthCharges.reduce((sum, c) => sum + getAmountForCurrentMonth(c), 0);
          const totalProvisions = totalSavings + totalEmergency + totalHealth;

          // Compter uniquement les charges actives ce mois (non suspendues)
          const activeSavingsCount = savingsCharges.filter(c => getAmountForCurrentMonth(c) > 0).length;
          const activeEmergencyCount = emergencyCharges.filter(c => getAmountForCurrentMonth(c) > 0).length;
          const activeHealthCount = healthCharges.filter(c => getAmountForCurrentMonth(c) > 0).length;

          if (totalProvisions === 0) return null;

          return (
            <div className="rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-purple-600 p-2">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-900">Provisions & Épargne mensuelle</h3>
                  <p className="text-sm text-purple-700">
                    Montant total mis de côté chaque mois pour vos objectifs d'épargne et provisions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-white border-2 border-purple-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-purple-700">Total ce mois</p>
                  <p className="mt-2 text-3xl font-bold text-purple-600">{formatCurrency(totalProvisions)}</p>
                  <p className="mt-1 text-xs text-purple-600">
                    {activeSavingsCount + activeEmergencyCount + activeHealthCount} charge(s) active(s)
                  </p>
                </div>

                {savingsCharges.length > 0 && (
                  <div className="rounded-lg bg-white border-2 border-green-200 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-green-700 flex items-center gap-1">
                      <span>💰</span> Épargne
                    </p>
                    <p className="mt-2 text-2xl font-bold text-green-600">{formatCurrency(totalSavings)}</p>
                    <p className="mt-1 text-xs text-green-600">
                      {activeSavingsCount > 0 ? `${activeSavingsCount} active(s)` : 'Toutes suspendues ce mois'}
                    </p>
                  </div>
                )}

                {emergencyCharges.length > 0 && (
                  <div className="rounded-lg bg-white border-2 border-amber-200 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-amber-700 flex items-center gap-1">
                      <span>⚠️</span> Imprévus
                    </p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(totalEmergency)}</p>
                    <p className="mt-1 text-xs text-amber-600">
                      {activeEmergencyCount > 0 ? `${activeEmergencyCount} active(s)` : 'Toutes suspendues ce mois'}
                    </p>
                  </div>
                )}

                {healthCharges.length > 0 && (
                  <div className="rounded-lg bg-white border-2 border-blue-200 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-700 flex items-center gap-1">
                      <span>🏥</span> Santé
                    </p>
                    <p className="mt-2 text-2xl font-bold text-blue-600">{formatCurrency(totalHealth)}</p>
                    <p className="mt-1 text-xs text-blue-600">
                      {activeHealthCount > 0 ? `${activeHealthCount} active(s)` : 'Toutes suspendues ce mois'}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-lg bg-purple-100 border border-purple-300 p-3">
                <p className="text-sm text-purple-900">
                  <strong>📊 Montant ce mois ({new Date(currentMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}):</strong> {formatCurrency(totalProvisions)}
                  {(activeSavingsCount + activeEmergencyCount + activeHealthCount) < (savingsCharges.length + emergencyCharges.length + healthCharges.length) && (
                    <span className="ml-2 text-amber-700">
                      • {(savingsCharges.length + emergencyCharges.length + healthCharges.length) - (activeSavingsCount + activeEmergencyCount + activeHealthCount)} charge(s) suspendue(s)
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Projection sur 6 mois - Provisions & Épargne - Collapsible */}
        {(() => {
          // Helper: calcule le montant réel pour un mois donné
          const getAmountForMonth = (charge: RecurringCharge, month: string): number => {
            // Vérifie si la charge est active pour ce mois (dans la période start_date/end_date)
            if (charge.start_date > month) return 0;
            if (charge.end_date && charge.end_date < month) return 0;

            // Vérifie si le mois est exclu (suspendu)
            if (charge.excluded_months && charge.excluded_months.includes(month)) {
              return 0;
            }

            // Vérifie s'il y a un override pour ce mois
            if (charge.monthly_overrides && charge.monthly_overrides[month] !== undefined) {
              return charge.monthly_overrides[month];
            }

            // Retourne le montant de base
            return charge.amount;
          };

          // Filtre les charges par type de provision
          const savingsCharges = chargesWithoutDebts.filter((c) => c.purpose === 'SAVINGS' && c.type === 'EXPENSE');
          const emergencyCharges = chargesWithoutDebts.filter((c) => c.purpose === 'EMERGENCY' && c.type === 'EXPENSE');
          const healthCharges = chargesWithoutDebts.filter((c) => c.purpose === 'HEALTH' && c.type === 'EXPENSE');
          const allProvisionCharges = [...savingsCharges, ...emergencyCharges, ...healthCharges];

          if (allProvisionCharges.length === 0) return null;

          // Génère les 6 prochains mois
          const projectionMonths: string[] = [];
          const today = new Date();
          for (let i = 0; i < 6; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            projectionMonths.push(month);
          }

          // Calcule les montants pour chaque mois
          const projectionData = projectionMonths.map((month) => {
            const savings = savingsCharges.reduce((sum, c) => sum + getAmountForMonth(c, month), 0);
            const emergency = emergencyCharges.reduce((sum, c) => sum + getAmountForMonth(c, month), 0);
            const health = healthCharges.reduce((sum, c) => sum + getAmountForMonth(c, month), 0);
            const total = savings + emergency + health;

            return {
              month,
              savings,
              emergency,
              health,
              total,
            };
          });

          // Calcule les cumuls
          let cumulSavings = 0;
          let cumulEmergency = 0;
          let cumulHealth = 0;
          const projectionWithCumul = projectionData.map((data) => {
            cumulSavings += data.savings;
            cumulEmergency += data.emergency;
            cumulHealth += data.health;
            return {
              ...data,
              cumulTotal: cumulSavings + cumulEmergency + cumulHealth,
              cumulSavings,
              cumulEmergency,
              cumulHealth,
            };
          });

          const totalProjection6Months = projectionWithCumul[projectionWithCumul.length - 1].cumulTotal;

          return (
            <div className="rounded-lg border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50">
              {/* Header collapsible */}
              <button
                onClick={() => setShowProjection(!showProjection)}
                className="flex w-full items-center justify-between p-6 text-left hover:bg-indigo-100/50 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-indigo-100 p-2">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-indigo-900">Projection sur 6 mois</h3>
                    <p className="text-sm text-indigo-700">
                      Accumulation prévisionnelle de vos provisions et épargnes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white border-2 border-indigo-200 px-4 py-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-indigo-700">Total cumulé (6 mois)</p>
                    <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalProjection6Months)}</p>
                  </div>
                  <svg
                    className={`h-6 w-6 text-indigo-700 transition-transform ${showProjection ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Contenu collapsible */}
              {showProjection && (
                <div className="px-6 pb-6">{/* Ligne de séparation */}
                <div className="mb-4 border-t border-indigo-200"></div>

              {/* Tableau de projection */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-indigo-200">
                      <th className="px-3 py-2 text-left font-semibold text-indigo-900">Mois</th>
                      <th className="px-3 py-2 text-right font-semibold text-green-700">💰 Épargne</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-700">⚠️ Imprévus</th>
                      <th className="px-3 py-2 text-right font-semibold text-blue-700">🏥 Santé</th>
                      <th className="px-3 py-2 text-right font-semibold text-indigo-900">Total mois</th>
                      <th className="px-3 py-2 text-right font-semibold text-purple-900">Cumul</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectionWithCumul.map((data, index) => {
                      const isCurrentMonth = data.month === currentMonth;
                      return (
                        <tr
                          key={data.month}
                          className={`border-b border-indigo-100 ${
                            isCurrentMonth
                              ? 'bg-indigo-100 font-semibold'
                              : index % 2 === 0
                              ? 'bg-white'
                              : 'bg-indigo-50/30'
                          }`}
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {isCurrentMonth && (
                                <span className="inline-flex items-center rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                                  Actuel
                                </span>
                              )}
                              <span className={isCurrentMonth ? 'text-indigo-900' : 'text-slate-700'}>
                                {new Date(data.month + '-01').toLocaleDateString('fr-FR', {
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </td>
                          <td className={`px-3 py-2 text-right ${data.savings === 0 ? 'text-slate-400' : 'text-green-700'}`}>
                            {data.savings === 0 ? '-' : formatCurrency(data.savings)}
                          </td>
                          <td className={`px-3 py-2 text-right ${data.emergency === 0 ? 'text-slate-400' : 'text-amber-700'}`}>
                            {data.emergency === 0 ? '-' : formatCurrency(data.emergency)}
                          </td>
                          <td className={`px-3 py-2 text-right ${data.health === 0 ? 'text-slate-400' : 'text-blue-700'}`}>
                            {data.health === 0 ? '-' : formatCurrency(data.health)}
                          </td>
                          <td className={`px-3 py-2 text-right font-medium ${isCurrentMonth ? 'text-indigo-900' : 'text-slate-900'}`}>
                            {formatCurrency(data.total)}
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${isCurrentMonth ? 'text-purple-900' : 'text-purple-700'}`}>
                            {formatCurrency(data.cumulTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Statistiques en bas */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg bg-white border border-green-200 p-3">
                  <p className="text-xs font-medium text-green-700">💰 Épargne (6 mois)</p>
                  <p className="text-lg font-bold text-green-800">
                    {formatCurrency(projectionWithCumul[projectionWithCumul.length - 1].cumulSavings)}
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-amber-200 p-3">
                  <p className="text-xs font-medium text-amber-700">⚠️ Imprévus (6 mois)</p>
                  <p className="text-lg font-bold text-amber-800">
                    {formatCurrency(projectionWithCumul[projectionWithCumul.length - 1].cumulEmergency)}
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-blue-200 p-3">
                  <p className="text-xs font-medium text-blue-700">🏥 Santé (6 mois)</p>
                  <p className="text-lg font-bold text-blue-800">
                    {formatCurrency(projectionWithCumul[projectionWithCumul.length - 1].cumulHealth)}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-indigo-100 px-3 py-2">
                <p className="text-xs text-indigo-800">
                  💡 <strong>Note:</strong> Cette projection prend en compte vos suspensions et ajustements mensuels programmés.
                  Les montants affichés reflètent les charges actives pour chaque mois.
                </p>
              </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Rappels actifs pour ce mois */}
        {activeReminders.length > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-sm font-semibold text-orange-900">
                Rappels actifs pour {new Date(currentMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} ({activeReminders.length})
              </h3>
            </div>
            <div className="space-y-2">
              {activeReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start justify-between rounded-lg bg-white border border-orange-200 p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{reminder.chargeLabel}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{reminder.note}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const charge = charges.find((c) => c.id === reminder.chargeId);
                        if (charge) startEdit(charge);
                      }}
                      className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={async () => {
                        const charge = charges.find((c) => c.id === reminder.chargeId);
                        if (!charge) return;

                        const updatedReminders = charge.reminders.map((r) =>
                          r.id === reminder.id ? { ...r, dismissed: true } : r
                        );

                        await fetch(`/api/recurring-charges?id=${charge.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            ...charge,
                            start_date: charge.start_date,
                            end_date: charge.end_date || null,
                            reminders: updatedReminders,
                          }),
                        });

                        await fetchCharges();
                      }}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Ignorer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Filtres et organisation */}
        {charges.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
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

              <div>
                <label htmlFor="sort-by" className="block text-xs font-medium text-slate-700 mb-1">
                  Trier par
                </label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'label' | 'amount')}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                >
                  <option value="label">Libellé (A-Z)</option>
                  <option value="amount">Montant (élevé → bas)</option>
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
                    Réinitialiser
                  </button>
                </div>
              )}
            </div>

            {/* Organisation */}
            <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupByType}
                  onChange={(e) => setGroupByType(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <span className="text-xs font-medium text-slate-700">Grouper par type</span>
              </label>

              {groupByType && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showIncome}
                      onChange={(e) => setShowIncome(e.target.checked)}
                      className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-xs font-medium text-green-700">Afficher revenus</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showExpense}
                      onChange={(e) => setShowExpense(e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-xs font-medium text-red-700">Afficher dépenses</span>
                  </label>
                </>
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

            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-slate-700">
                Usage <span className="text-red-500">*</span>
              </label>
              <select
                id="purpose"
                required
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value as 'REGULAR' | 'SAVINGS' | 'EMERGENCY' | 'HEALTH' | 'DEBT' })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
              >
                <option value="REGULAR">💼 Charge normale (loyer, Netflix, téléphone...)</option>
                <option value="SAVINGS">💰 Épargne (Revolut, livret A...)</option>
                <option value="EMERGENCY">⚠️ Provision pour imprévus</option>
                <option value="HEALTH">🏥 Provision santé/médecin</option>
                <option value="DEBT">💳 Dette / Crédit à rembourser</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
                  {formData.purpose === 'DEBT' ? 'Mensualité' : 'Montant'} <span className="text-red-500">*</span>
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
                  placeholder={formData.purpose === 'DEBT' ? 'ex: 250' : ''}
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

            {/* Champs spécifiques aux dettes */}
            {formData.purpose === 'DEBT' && (
              <div className="border-2 border-red-200 bg-red-50 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                  <span>💳</span> Informations sur la dette
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="initial_balance" className="block text-sm font-medium text-slate-700">
                      Capital initial
                    </label>
                    <input
                      type="number"
                      id="initial_balance"
                      min="0"
                      step="0.01"
                      value={formData.initial_balance}
                      onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
                      placeholder="ex: 5000"
                    />
                    <p className="mt-1 text-xs text-slate-500">Montant total emprunté</p>
                  </div>

                  <div>
                    <label htmlFor="remaining_balance" className="block text-sm font-medium text-slate-700">
                      Capital restant <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="remaining_balance"
                      required={formData.purpose === 'DEBT'}
                      min="0"
                      step="0.01"
                      value={formData.remaining_balance}
                      onChange={(e) => setFormData({ ...formData, remaining_balance: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
                      placeholder="ex: 4200"
                    />
                    <p className="mt-1 text-xs text-slate-500">Montant qu'il reste à rembourser</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="interest_rate" className="block text-sm font-medium text-slate-700">
                      Taux d'intérêt annuel (%)
                    </label>
                    <input
                      type="number"
                      id="interest_rate"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
                      placeholder="ex: 5.5"
                    />
                    <p className="mt-1 text-xs text-slate-500">Optionnel - pour calcul des intérêts</p>
                  </div>

                  <div>
                    <label htmlFor="debt_start_date" className="block text-sm font-medium text-slate-700">
                      Date de début du prêt
                    </label>
                    <input
                      type="date"
                      id="debt_start_date"
                      value={formData.debt_start_date}
                      onChange={(e) => setFormData({ ...formData, debt_start_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">Date où le prêt a commencé</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-xs text-amber-800">
                    💡 <strong>Note:</strong> Le champ "Mensualité" en haut représente votre paiement mensuel.
                    Avec ces informations, le système calculera automatiquement la projection de remboursement.
                  </p>
                </div>
              </div>
            )}

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
                <div
                  onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                  className="w-full flex items-center justify-between hover:text-slate-900 cursor-pointer"
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
                </div>

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
                <div
                  onClick={() => setShowMonthlyOverridesSection(!showMonthlyOverridesSection)}
                  className="flex items-center justify-between cursor-pointer hover:opacity-80"
                >
                  <span className="text-sm font-medium text-slate-700">Montants variables (optionnel)</span>
                  <div className="flex items-center gap-2">
                    {Object.keys(formData.monthly_overrides).length > 0 && (
                      <span className="text-xs bg-green-200 text-green-900 px-2 py-0.5 rounded-full font-medium">
                        {Object.keys(formData.monthly_overrides).length}
                      </span>
                    )}
                    <svg
                      className={`h-4 w-4 transition-transform ${showMonthlyOverridesSection ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {showMonthlyOverridesSection && (
                  <>
                    <p className="text-xs text-green-800 mb-3 mt-2">
                      Le dernier montant défini reste actif pour les mois suivants (ex: augmentation de salaire, nouveau loyer)
                    </p>

                    {Object.keys(formData.monthly_overrides).length > 0 && (
                      <>
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

                        {/* Timeline visuelle */}
                        {(() => {
                          // Generate timeline for next 12 months from start_date or current month
                          const startMonth = formData.start_date || new Date().toISOString().slice(0, 7);
                          const timelineMonths: { month: string; amount: number; isOverride: boolean }[] = [];

                          for (let i = 0; i < 12; i++) {
                            const date = new Date(startMonth + '-01');
                            date.setMonth(date.getMonth() + i);
                            const monthStr = date.toISOString().slice(0, 7);

                            // Find effective amount for this month (cumulative logic)
                            let effectiveAmount = formData.amount;
                            let isOverride = false;

                            const sortedOverrides = Object.entries(formData.monthly_overrides)
                              .sort(([a], [b]) => a.localeCompare(b));

                            for (const [overrideMonth, overrideAmount] of sortedOverrides) {
                              if (overrideMonth <= monthStr) {
                                effectiveAmount = overrideAmount;
                                isOverride = overrideMonth === monthStr;
                              }
                            }

                            timelineMonths.push({ month: monthStr, amount: effectiveAmount, isOverride });
                          }

                          return (
                            <div className="mb-3 bg-white rounded border border-green-300 p-2">
                              <div className="text-xs font-medium text-slate-600 mb-2">Timeline (12 prochains mois)</div>
                              <div className="grid grid-cols-6 gap-1 text-xs">
                                {timelineMonths.map(({ month, amount, isOverride }, idx) => (
                                  <div key={`timeline-${idx}-${month}`} className="flex flex-col items-center">
                                    <div className="text-[10px] text-slate-500 mb-0.5">
                                      {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' })}
                                    </div>
                                    <div
                                      className={`rounded px-1.5 py-0.5 font-medium text-center w-full ${
                                        isOverride
                                          ? 'bg-green-500 text-white shadow-sm'
                                          : 'bg-green-100 text-green-900'
                                      }`}
                                    >
                                      {formatCurrency(amount)}
                                    </div>
                                    {isOverride && (
                                      <div className="text-[9px] text-green-700 mt-0.5">override</div>
                                    )}
                                    {idx > 0 && timelineMonths[idx - 1].amount !== amount && !isOverride && (
                                      <div className="text-[9px] text-green-600 mt-0.5">↑ propagé</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-center gap-3 py-1">
                        <button
                          type="button"
                          onClick={() => setOverrideYear(overrideYear - 1)}
                          className="rounded p-1 hover:bg-green-200 text-slate-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-sm font-semibold text-slate-900 min-w-[60px] text-center">{overrideYear}</span>
                        <button
                          type="button"
                          onClick={() => setOverrideYear(overrideYear + 1)}
                          className="rounded p-1 hover:bg-green-200 text-slate-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((monthName, index) => {
                          const monthStr = String(index + 1).padStart(2, '0');
                          const yearMonth = `${overrideYear}-${monthStr}`;
                          const isSelected = formData.override_month === yearMonth;

                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleOverrideMonthClick(index)}
                              className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                                isSelected
                                  ? 'bg-green-500 text-white shadow-sm'
                                  : 'bg-white border border-green-300 text-slate-700 hover:bg-green-100'
                              }`}
                            >
                              {monthName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.override_amount}
                        onChange={(e) => setFormData({ ...formData, override_amount: e.target.value })}
                        className="flex-1 rounded border border-green-300 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                        placeholder="Montant pour le mois sélectionné"
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
                  </>
                )}
              </div>

              {/* Rappels */}
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div
                  onClick={() => setShowRemindersSection(!showRemindersSection)}
                  className="flex items-center justify-between cursor-pointer hover:opacity-80"
                >
                  <span className="text-sm font-medium text-slate-700">Rappels (optionnel)</span>
                  <div className="flex items-center gap-2">
                    {formData.reminders.filter((r) => !r.dismissed).length > 0 && (
                      <span className="text-xs bg-orange-200 text-orange-900 px-2 py-0.5 rounded-full font-medium">
                        {formData.reminders.filter((r) => !r.dismissed).length}
                      </span>
                    )}
                    <svg
                      className={`h-4 w-4 transition-transform ${showRemindersSection ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {showRemindersSection && (
                  <>
                    <p className="text-xs text-orange-800 mb-3 mt-2">
                      Créez des rappels pour ne pas oublier de mettre à jour cette charge à une date précise
                    </p>

                    {formData.reminders.filter((r) => !r.dismissed).length > 0 && (
                      <div className="mb-3 space-y-2">
                        {formData.reminders
                          .filter((r) => !r.dismissed)
                          .sort((a, b) => a.month.localeCompare(b.month))
                          .map((reminder) => (
                            <div
                              key={reminder.id}
                              className="flex items-start gap-2 rounded bg-orange-100 px-3 py-2 text-xs"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-orange-900">
                                  {new Date(reminder.month + '-01').toLocaleDateString('fr-FR', {
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </div>
                                <div className="text-orange-800 mt-0.5">{reminder.note}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeReminder(reminder.id)}
                                className="text-orange-600 hover:text-orange-900 font-medium"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-center gap-3 py-1">
                        <button
                          type="button"
                          onClick={() => setReminderYear(reminderYear - 1)}
                          className="rounded p-1 hover:bg-orange-200 text-slate-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-sm font-semibold text-slate-900 min-w-[60px] text-center">{reminderYear}</span>
                        <button
                          type="button"
                          onClick={() => setReminderYear(reminderYear + 1)}
                          className="rounded p-1 hover:bg-orange-200 text-slate-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((monthName, index) => {
                          const monthStr = String(index + 1).padStart(2, '0');
                          const yearMonth = `${reminderYear}-${monthStr}`;
                          const isSelected = formData.reminder_month === yearMonth;

                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleReminderMonthClick(index)}
                              className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                                isSelected
                                  ? 'bg-orange-500 text-white shadow-sm'
                                  : 'bg-white border border-orange-300 text-slate-700 hover:bg-orange-100'
                              }`}
                            >
                              {monthName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.reminder_note}
                        onChange={(e) => setFormData({ ...formData, reminder_note: e.target.value })}
                        className="flex-1 rounded border border-orange-300 px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                        placeholder="Note pour le mois sélectionné (ex: Augmentation de loyer)"
                        maxLength={100}
                      />
                      <button
                        type="button"
                        onClick={addReminder}
                        disabled={!formData.reminder_month || !formData.reminder_note.trim()}
                        className="rounded bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Ajouter
                      </button>
                    </div>
                  </>
                )}
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
        ) : groupByType ? (
          <div className="space-y-6">
            {/* Revenus */}
            {showIncome && groupedCharges.INCOME && groupedCharges.INCOME.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                    Revenus
                    <span className="text-sm font-normal text-green-700">
                      ({groupedCharges.INCOME.length})
                    </span>
                  </h2>
                  <div className="text-sm font-semibold text-green-600">
                    Total: +{formatCurrency(groupedCharges.INCOME.reduce((sum, c) => sum + c.amount, 0))} / mois
                  </div>
                </div>
                <div className="space-y-3">
                  {groupedCharges.INCOME.map((charge) => renderChargeCard(charge))}
                </div>
              </div>
            )}

            {/* Dépenses */}
            {showExpense && groupedCharges.EXPENSE && groupedCharges.EXPENSE.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </span>
                    Dépenses
                    <span className="text-sm font-normal text-red-700">
                      ({groupedCharges.EXPENSE.length})
                    </span>
                  </h2>
                  <div className="text-sm font-semibold text-red-600">
                    Total: -{formatCurrency(groupedCharges.EXPENSE.reduce((sum, c) => sum + c.amount, 0))} / mois
                  </div>
                </div>
                <div className="space-y-3">
                  {groupedCharges.EXPENSE.map((charge) => renderChargeCard(charge))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCharges.map((charge) => renderChargeCard(charge))}
          </div>
        )}
      </div>
    </main>
  );
}
