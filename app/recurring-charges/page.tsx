'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format';
import { RecurringChargeModal } from '@/components/recurring/RecurringChargeModal';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Calendar,
  AlertCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Settings2,
  Search,
  Filter,
  CreditCard,
  Heart,
  ShieldAlert,
  PiggyBank,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit3,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [groupByAccount, setGroupByAccount] = useState(false);

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterAccount('ALL');
    setSearchQuery('');
  };

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

  // Grouper par type ou par compte
  const getGroupedCharges = () => {
    if (groupByType) {
      return {
        INCOME: sortedCharges.filter((c) => c.type === 'INCOME'),
        EXPENSE: sortedCharges.filter((c) => c.type === 'EXPENSE'),
      };
    }
    if (groupByAccount) {
      return {
        SG: sortedCharges.filter((c) => c.account === 'SG'),
        FLOA: sortedCharges.filter((c) => c.account === 'FLOA'),
      };
    }
    return { ALL: sortedCharges };
  };

  const groupedCharges = getGroupedCharges();

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

    const getPurposeIcon = (purpose: string) => {
      switch (purpose) {
        case 'SAVINGS': return <PiggyBank className="h-4 w-4" />;
        case 'EMERGENCY': return <ShieldAlert className="h-4 w-4" />;
        case 'HEALTH': return <Heart className="h-4 w-4" />;
        case 'DEBT': return <CreditCard className="h-4 w-4" />;
        default: return <BarChart3 className="h-4 w-4" />;
      }
    };

    return (
      <motion.div
        layout
        key={charge.id}
        className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            className="flex-1 cursor-pointer min-w-0"
            onClick={() => {
              const newExpanded = new Set(expandedCharges);
              if (isExpanded) newExpanded.delete(charge.id);
              else newExpanded.add(charge.id);
              setExpandedCharges(newExpanded);
            }}
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-flex items-center justify-center rounded-lg p-1.5 ${charge.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                }`}>
                {getPurposeIcon(charge.purpose)}
              </span>
              <h3 className="font-bold text-slate-900 truncate max-w-[200px]">{charge.label}</h3>

              <div className="flex items-center gap-1.5 ml-1">
                {!groupByType && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${charge.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                    {charge.type === 'INCOME' ? 'Revenu' : 'Dépense'}
                  </span>
                )}
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-100">
                  {charge.account}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${charge.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                {charge.type === 'INCOME' ? '+' : '-'}{formatCurrency(charge.amount)}
              </span>
              <span className="text-xs font-medium text-slate-400">/ mois</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-3">
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(charge.start_date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  {charge.end_date && <> → {new Date(charge.end_date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</>}
                </span>
              </div>

              {charge.excluded_months && charge.excluded_months.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                  <Clock className="h-3 w-3" />
                  <span>{charge.excluded_months.length} suspension(s)</span>
                </div>
              )}

              {charge.reminders && charge.reminders.filter((r) => !r.dismissed).length > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  <AlertCircle className="h-3 w-3" />
                  <span>{charge.reminders.filter((r) => !r.dismissed).length} rappel(s)</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
            <button
              onClick={() => startEdit(charge)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-95"
            >
              <Edit3 className="h-4 w-4" />
              <span className="sm:hidden lg:inline">Modifier</span>
            </button>
            <button
              onClick={() => handleDelete(charge.id)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sm:hidden lg:inline">Supprimer</span>
            </button>
            {hasDetails && (
              <button
                onClick={() => {
                  const newExpanded = new Set(expandedCharges);
                  if (isExpanded) newExpanded.delete(charge.id);
                  else newExpanded.add(charge.id);
                  setExpandedCharges(newExpanded);
                }}
                className={`ml-1 flex items-center justify-center h-10 w-10 rounded-xl bg-slate-900 text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/10 ${isExpanded ? 'rotate-180 bg-indigo-600 shadow-indigo-600/20' : ''
                  }`}
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Forecast Timeline / Visual Data */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Projection 12 mois</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">Prévisionnel</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {(() => {
              const today = new Date();
              const result = [];
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
                  const sortedOverrides = Object.entries(charge.monthly_overrides).sort(([a], [b]) => a.localeCompare(b));
                  for (const [overrideMonth, overrideAmount] of sortedOverrides) {
                    if (overrideMonth <= monthStr) {
                      effectiveAmount = overrideAmount;
                      isOverride = overrideMonth === monthStr;
                    }
                  }
                }

                result.push(
                  <div key={monthStr} className="flex flex-col items-center gap-1 group/item">
                    <span className={`text-[9px] font-bold transition-colors ${monthStr === currentMonth ? 'text-indigo-600 scale-110' : 'text-slate-400'
                      }`}>
                      {date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase()}
                    </span>
                    <div
                      className={`h-10 w-full rounded-lg border flex flex-col items-center justify-center transition-all ${isOutOfPeriod ? 'bg-slate-50 border-slate-100 opacity-30 select-none' :
                        isExcluded ? 'bg-amber-50 border-amber-100 text-amber-500' :
                          isOverride ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                            monthStr === currentMonth ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                              'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                        }`}
                      title={`${date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}: ${isOutOfPeriod ? 'Inactive' : isExcluded ? 'Suspendue' : formatCurrency(effectiveAmount)
                        }`}
                    >
                      {isOutOfPeriod || isExcluded ? (
                        <span className="text-[14px]">×</span>
                      ) : (
                        <>
                          <span className="text-[10px] font-black leading-none">{Math.round(effectiveAmount)}</span>
                          <span className="text-[7px] font-bold opacity-70">€</span>
                        </>
                      )}
                      {hasReminder && !isExcluded && !isOutOfPeriod && (
                        <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600 border border-white"></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return result;
            })()}
          </div>
        </div>

        {/* Detailed Panels */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 space-y-4 pt-4 border-t border-slate-100">
                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.keys(charge.monthly_overrides).length > 0 && (
                    <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-4">
                      <div className="flex items-center gap-2 mb-3 text-emerald-800">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-black uppercase tracking-wider">Ajustements Mensuels</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(charge.monthly_overrides)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([month, amount]) => (
                            <div key={month} className="flex items-center gap-2 bg-white rounded-xl border border-emerald-100 px-3 py-1.5 shadow-sm">
                              <span className="text-[10px] font-bold text-slate-400">{new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}</span>
                              <span className="text-xs font-black text-emerald-700">{formatCurrency(amount)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {charge.excluded_months && charge.excluded_months.length > 0 && (
                    <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-4">
                      <div className="flex items-center gap-2 mb-3 text-amber-800">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-black uppercase tracking-wider">Périodes de Suspension</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {charge.excluded_months.sort().map((month) => (
                          <div key={month} className={`px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${month === currentMonth ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-amber-200 text-amber-700'
                            }`}>
                            {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {charge.reminders && charge.reminders.filter((r) => !r.dismissed).length > 0 && (
                  <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4">
                    <div className="flex items-center gap-2 mb-3 text-indigo-800">
                      <Info className="h-4 w-4" />
                      <span className="text-xs font-black uppercase tracking-wider">Notes & Mémos</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {charge.reminders
                        .filter((r) => !r.dismissed)
                        .sort((a, b) => a.month.localeCompare(b.month))
                        .map((reminder) => (
                          <div key={reminder.id} className="flex flex-col gap-1 bg-white rounded-xl border border-indigo-100 p-3 shadow-sm">
                            <div className="text-[10px] font-black text-indigo-600/60 uppercase">{new Date(reminder.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                            <div className="text-xs font-bold text-slate-700 leading-relaxed">{reminder.note}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
      <div className="space-y-6 sm:space-y-8">
        <header className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-8 sm:px-10 sm:py-12 shadow-2xl">
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                Charges récurrentes
              </h1>
              <p className="text-slate-400 max-w-lg leading-relaxed">
                Visualisez et orchestrez vos flux financiers mensuels. Vos revenus, charges fixes et provisions en un seul coup d'œil.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-slate-900 transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-white/10"
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter une charge</span>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </button>
          </div>

          {/* Background decorations */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        </header>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Panneau de statistiques Dashboard Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900">{stats.total}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="text-emerald-500">{stats.income} entrées</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-500">{stats.expense} sorties</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-100 group-hover:bg-slate-900 transition-colors" />
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60">Revenus</div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-emerald-600">+{formatCurrency(stats.totalIncome)}</div>
              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600/70">
                <TrendingUp className="h-3 w-3" />
                <span>Flux mensuel stable</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-100/50 group-hover:bg-emerald-600 transition-colors" />
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-rose-50/30 p-5 transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-rose-100 p-2 text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                <ArrowDownRight className="h-6 w-6" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-rose-600/60">Charges</div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-rose-600">-{formatCurrency(stats.totalExpense)}</div>
              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-rose-600/70">
                <TrendingDown className="h-3 w-3" />
                <span>Sorties programmées</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-rose-100/50 group-hover:bg-rose-600 transition-colors" />
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600/60">Solde</div>
            </div>
            <div className="mt-4">
              <div className={`text-3xl font-black ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                {stats.totalIncome - stats.totalExpense >= 0 ? '+' : ''}{formatCurrency(stats.totalIncome - stats.totalExpense)}
              </div>
              <div className="mt-1 text-xs font-medium text-indigo-600/70 flex gap-2">
                <span>SG: {stats.sg}</span>
                <span className="opacity-30">•</span>
                <span>FLOA: {stats.floa}</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-indigo-100/50 group-hover:bg-indigo-600 transition-colors" />
          </div>
        </div>

        {/* Panneau récapitulatif des provisions et épargnes */}
        {(() => {
          const getAmountForCurrentMonth = (charge: RecurringCharge): number => {
            if (charge.excluded_months && charge.excluded_months.includes(currentMonth)) return 0;
            if (charge.monthly_overrides && charge.monthly_overrides[currentMonth] !== undefined) return charge.monthly_overrides[currentMonth];
            return charge.amount;
          };

          const savingsCharges = chargesWithoutDebts.filter((c) => c.purpose === 'SAVINGS' && c.type === 'EXPENSE');
          const emergencyCharges = chargesWithoutDebts.filter((c) => c.purpose === 'EMERGENCY' && c.type === 'EXPENSE');
          const healthCharges = chargesWithoutDebts.filter((c) => c.purpose === 'HEALTH' && c.type === 'EXPENSE');

          const totalSavings = savingsCharges.reduce((sum, c) => sum + getAmountForCurrentMonth(c), 0);
          const totalEmergency = emergencyCharges.reduce((sum, c) => sum + getAmountForCurrentMonth(c), 0);
          const totalHealth = healthCharges.reduce((sum, c) => sum + getAmountForCurrentMonth(c), 0);
          const totalProvisions = totalSavings + totalEmergency + totalHealth;

          const activeSavingsCount = savingsCharges.filter(c => getAmountForCurrentMonth(c) > 0).length;
          const activeEmergencyCount = emergencyCharges.filter(c => getAmountForCurrentMonth(c) > 0).length;
          const activeHealthCount = healthCharges.filter(c => getAmountForCurrentMonth(c) > 0).length;

          if (totalProvisions === 0) return null;

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 sm:p-8 shadow-2xl text-white"
            >
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/20">
                      <PiggyBank className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Provisions & Épargne</h3>
                      <p className="text-indigo-100/70 text-sm font-medium">Accumulation mensuelle programmée</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200/60 mb-1">Total ce mois</div>
                    <div className="text-4xl font-black text-white leading-none">{formatCurrency(totalProvisions)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {savingsCharges.length > 0 && (
                    <div className="group relative overflow-hidden rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">💰 Épargne</span>
                      </div>
                      <div className="text-2xl font-black tracking-tight">{formatCurrency(totalSavings)}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-white/40 uppercase">{activeSavingsCount} active(s)</div>
                        {activeSavingsCount === 0 && <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full">Suspendue</span>}
                      </div>
                    </div>
                  )}

                  {emergencyCharges.length > 0 && (
                    <div className="group relative overflow-hidden rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">⚠️ Imprévus</span>
                      </div>
                      <div className="text-2xl font-black tracking-tight">{formatCurrency(totalEmergency)}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-white/40 uppercase">{activeEmergencyCount} active(s)</div>
                        {activeEmergencyCount === 0 && <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full">Suspendue</span>}
                      </div>
                    </div>
                  )}

                  {healthCharges.length > 0 && (
                    <div className="group relative overflow-hidden rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                          <Heart className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">🏥 Santé</span>
                      </div>
                      <div className="text-2xl font-black tracking-tight">{formatCurrency(totalHealth)}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-white/40 uppercase">{activeHealthCount} active(s)</div>
                        {activeHealthCount === 0 && <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full">Suspendue</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center gap-2 rounded-xl bg-black/20 px-4 py-3 text-xs font-medium text-indigo-100/90 border border-white/5">
                  <Info className="h-4 w-4 text-indigo-400" />
                  <span>
                    <strong>{new Date(currentMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} :</strong>
                    {' '}Votre stratégie d'épargne est active à {Math.round(((activeSavingsCount + activeEmergencyCount + activeHealthCount) / (savingsCharges.length + emergencyCharges.length + healthCharges.length)) * 100)}%.
                  </span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />
            </motion.div>
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
                              className={`border-b border-indigo-100 ${isCurrentMonth
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
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${month === currentMonth
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

        {/* Toolbar & Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une charge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filtrer</span>
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  <option value="ALL">Tout</option>
                  <option value="INCOME">Revenus</option>
                  <option value="EXPENSE">Dépenses</option>
                </select>

                <select
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  <option value="ALL">Tous les comptes</option>
                  <option value="SG">Société Générale</option>
                  <option value="FLOA">FLOA Bank</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <Settings2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vue</span>
                </div>
                <button
                  onClick={() => setGroupByAccount(!groupByAccount)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${groupByAccount ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  Par compte
                </button>
                <button
                  onClick={() => setGroupByType(!groupByType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${groupByType ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  Par type
                </button>
                <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                <button
                  onClick={resetFilters}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Réinitialiser"
                >
                  <Clock className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <RecurringChargeModal
          isOpen={showForm}
          onClose={cancelEdit}
          editingId={editingId}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          submitting={submitting}
          showStartDatePicker={showStartDatePicker}
          setShowStartDatePicker={setShowStartDatePicker}
          showEndDatePicker={showEndDatePicker}
          setShowEndDatePicker={setShowEndDatePicker}
          showExcludedMonthsPicker={showExcludedMonthsPicker}
          setShowExcludedMonthsPicker={setShowExcludedMonthsPicker}
          showMonthlyOverridesSection={showMonthlyOverridesSection}
          setShowMonthlyOverridesSection={setShowMonthlyOverridesSection}
          showRemindersSection={showRemindersSection}
          setShowRemindersSection={setShowRemindersSection}
          startDateYear={startDateYear}
          setStartDateYear={setStartDateYear}
          endDateYear={endDateYear}
          setEndDateYear={setEndDateYear}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          overrideYear={overrideYear}
          setOverrideYear={setOverrideYear}
          reminderYear={reminderYear}
          setReminderYear={setReminderYear}
          handleStartDateClick={handleStartDateClick}
          handleEndDateClick={handleEndDateClick}
          clearEndDate={clearEndDate}
          handleMonthClick={handleMonthClick}
          removeExcludedMonth={removeExcludedMonth}
          handleOverrideMonthClick={handleOverrideMonthClick}
          addMonthlyOverride={addMonthlyOverride}
          removeMonthlyOverride={removeMonthlyOverride}
          handleReminderMonthClick={handleReminderMonthClick}
          addReminder={addReminder}
          removeReminder={removeReminder}
          formatCurrency={formatCurrency}
        />

        <div className="space-y-8">
          {charges.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-50 text-slate-400 mb-4">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Aucune charge définie</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Commencez par ajouter vos revenus et vos charges récurrentes pour visualiser votre flux financier.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-all"
              >
                Ajouter ma première charge
              </button>
            </div>
          ) : filteredCharges.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-50 text-slate-400 mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Aucun résultat</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Nous n'avons trouvé aucune charge correspondant à vos critères de recherche ou filtres.</p>
              <button
                onClick={resetFilters}
                className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-all"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : groupByType ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenus */}
              {showIncome && groupedCharges.INCOME && groupedCharges.INCOME.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      Revenus
                      <span className="text-slate-400 text-sm font-medium">({groupedCharges.INCOME.length})</span>
                    </h2>
                    <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      Total: +{formatCurrency(groupedCharges.INCOME.reduce((sum, c) => sum + c.amount, 0))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {groupedCharges.INCOME.map((charge) => renderChargeCard(charge))}
                  </div>
                </div>
              )}

              {/* Dépenses */}
              {showExpense && groupedCharges.EXPENSE && groupedCharges.EXPENSE.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      Dépenses
                      <span className="text-slate-400 text-sm font-medium">({groupedCharges.EXPENSE.length})</span>
                    </h2>
                    <div className="text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                      Total: -{formatCurrency(groupedCharges.EXPENSE.reduce((sum, c) => sum + c.amount, 0))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {groupedCharges.EXPENSE.map((charge) => renderChargeCard(charge))}
                  </div>
                </div>
              )}
            </div>
          ) : groupByAccount ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* SG */}
              {groupedCharges.SG && groupedCharges.SG.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      Société Générale
                      <span className="text-slate-400 text-sm font-medium">({groupedCharges.SG.length})</span>
                    </h2>
                    <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      Solde: {formatCurrency(groupedCharges.SG.reduce((sum, c) => sum + (c.type === 'INCOME' ? c.amount : -c.amount), 0))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {groupedCharges.SG.map((charge) => renderChargeCard(charge))}
                  </div>
                </div>
              )}

              {/* FLOA */}
              {groupedCharges.FLOA && groupedCharges.FLOA.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      FLOA Bank
                      <span className="text-slate-400 text-sm font-medium">({groupedCharges.FLOA.length})</span>
                    </h2>
                    <div className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                      Solde: {formatCurrency(groupedCharges.FLOA.reduce((sum, c) => sum + (c.type === 'INCOME' ? c.amount : -c.amount), 0))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {groupedCharges.FLOA.map((charge) => renderChargeCard(charge))}
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
      </div>
    </main>
  );
};
