'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Landmark, Tag, Calendar, Save, X, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, Shield } from 'lucide-react';
import { DatePicker } from '@/components/shared/DatePicker';
import { MonthPicker } from '@/components/shared/MonthPicker';

interface TransactionFormData {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  occurredAt: string; // YYYY-MM-DD
  account: 'SG' | 'FLOA';
  label: string;
  isDeferred: boolean;
  deferredTo?: string; // YYYY-MM
  priority?: number;
  budgetId?: string;
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'MONTHLY' | 'ROLLING' | 'MULTI';
}

export const TransactionForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);

  const [formData, setFormData] = useState<TransactionFormData>({
    amount: 0,
    type: 'EXPENSE',
    category: '',
    occurredAt: new Date().toISOString().split('T')[0],
    account: 'SG',
    label: '',
    isDeferred: false,
    priority: 9,
    budgetId: '',
  });

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error: fetchError } = await supabase
          .from('budgets')
          .select('id, category, amount, period')
          .eq('user_id', user.id)
          .order('category', { ascending: true });

        if (!fetchError && data) setBudgets(data as Budget[]);
      } catch (err) {
        console.error('Erreur lors du chargement des budgets:', err);
      } finally {
        setLoadingBudgets(false);
      }
    };

    fetchBudgets();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Vous devez être connecté pour ajouter une transaction');
        setLoading(false);
        return;
      }

      const payload = {
        date: formData.occurredAt,
        label: formData.label || (formData.type === 'INCOME' ? 'Revenu' : 'Dépense'),
        amount: formData.amount,
        category: formData.category,
        account: formData.account,
        type: formData.type,
        is_deferred: formData.isDeferred,
        deferred_to: formData.isDeferred ? formData.deferredTo : null,
        priority: formData.isDeferred ? formData.priority : 9,
        budget_id: formData.budgetId || null,
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Erreur lors de l\'enregistrement');
      }

      router.push('/analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof TransactionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 shadow-sm flex items-center gap-3"
        >
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Main Stats Group */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
            Libellé de la transaction
          </label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-lg font-black text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            placeholder="Ex: Courses Pack de lait, Salaire Janvier..."
          />
        </div>

        <div className="p-1.5 rounded-2xl bg-slate-100 flex gap-1.5">
          <button
            type="button"
            onClick={() => handleChange('type', 'EXPENSE')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ArrowDownRight className="h-4 w-4" />
            Dépense
          </button>
          <button
            type="button"
            onClick={() => handleChange('type', 'INCOME')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ArrowUpRight className="h-4 w-4" />
            Revenu
          </button>
        </div>

        <div className="relative">
          <CreditCard className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="number"
            required
            step="0.01"
            value={formData.amount === 0 ? '' : formData.amount}
            onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-14 pr-5 py-4 text-xl font-black text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            placeholder="0.00 €"
          />
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3 sm:col-span-2 mb-2">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
            <Tag className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Détails & Classement</h2>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Compte</label>
          <div className="relative">
            <Landmark className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={formData.account}
              onChange={(e) => handleChange('account', e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
            >
              <option value="SG">Société Générale (SG)</option>
              <option value="FLOA">FLOA Bank</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Catégorie</label>
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              placeholder="Ex: Alimentation..."
            />
          </div>
        </div>

        <div className="sm:col-span-2 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
          <label className="mb-2 block text-xs font-black uppercase tracking-widest text-indigo-600/60">Lier à un budget</label>
          <select
            value={formData.budgetId || ''}
            onChange={(e) => handleChange('budgetId', e.target.value)}
            disabled={loadingBudgets}
            className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer disabled:opacity-50"
          >
            <option value="">Aucun budget (Dépense libre)</option>
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>{b.category} ({b.amount}€)</option>
            ))}
          </select>
        </div>

        <DatePicker
          label="Date d'effet"
          value={formData.occurredAt}
          onChange={(val) => handleChange('occurredAt', val)}
          required
        />
      </div>

      {/* Deferred Section */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-3 transition-colors ${formData.isDeferred ? 'bg-amber-600 text-white shadow-lg shadow-amber-200' : 'bg-slate-100 text-slate-400'}`}>
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-sm font-black text-slate-900">Paiement Différé</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporter l'impact financier</span>
            </div>
          </div>
          <input
            type="checkbox"
            className="hidden"
            checked={formData.isDeferred}
            onChange={(e) => handleChange('isDeferred', e.target.checked)}
          />
          <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.isDeferred ? 'bg-amber-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isDeferred ? 'left-7' : 'left-1'}`} />
          </div>
        </label>

        <AnimatePresence>
          {formData.isDeferred && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              <MonthPicker
                label="Mois de débit"
                value={formData.deferredTo || ''}
                onChange={(val) => handleChange('deferredTo', val)}
                required
              />
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Priorité (1-9)</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="group relative flex flex-2 items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 py-5 text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-xl"
        >
          <Save className="h-5 w-5" />
          <span>{loading ? 'Enregistrement...' : 'Enregistrer la transaction'}</span>
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
        >
          <X className="h-5 w-5" />
          <span>Annuler</span>
        </button>
      </div>
    </form>
  );
};
