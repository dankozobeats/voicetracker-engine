'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Target, Euro, Calendar, Save, X, Info } from 'lucide-react';
import { DatePicker } from '@/components/shared/DatePicker';

interface BudgetFormData {
  category: string;
  amount: number;
  period: 'MONTHLY' | 'ROLLING' | 'MULTI';
  startDate: string;
  endDate: string;
}

export const BudgetForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<BudgetFormData>({
    category: '',
    amount: 0,
    period: 'MONTHLY',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Vous devez être connecté pour créer un budget');
        setLoading(false);
        return;
      }

      const payload: Record<string, unknown> = {
        category: formData.category,
        amount: formData.amount,
        period: formData.period,
      };

      if (formData.startDate) payload.startDate = formData.startDate;
      if (formData.endDate) payload.endDate = formData.endDate;

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Erreur lors de l\'enregistrement du budget');
      }

      router.push('/budgets#category');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof BudgetFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isMultiPeriod = formData.period === 'MULTI';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 shadow-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Basic Info Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Objectif du Budget</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="category" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                Catégorie <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Ex: Alimentation, Transport, Loisirs..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="amount" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                Montant (€) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Euro className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  id="amount"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.amount === 0 ? '' : formData.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="250.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="period" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                Périodicité <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="period"
                  required
                  value={formData.period}
                  onChange={(e) => handleChange('period', e.target.value as any)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                >
                  <option value="MONTHLY">Mensuel</option>
                  <option value="ROLLING">Glissant</option>
                  <option value="MULTI">Multi-mois</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Dates Section */}
        <section className="space-y-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                <Calendar className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Calendrier</h2>
            </div>
            {!isMultiPeriod && (
              <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-blue-700">
                <Info className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Optionnel</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <DatePicker
              label="Date de début"
              required={isMultiPeriod}
              value={formData.startDate}
              onChange={(val) => handleChange('startDate', val)}
              placeholder="Sélectionner le début"
            />
            <DatePicker
              label="Date de fin"
              required={isMultiPeriod}
              value={formData.endDate}
              onChange={(val) => handleChange('endDate', val)}
              placeholder="Sélectionner la fin"
            />
          </div>
        </section>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="group relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          <span>{loading ? 'Enregistrement...' : 'Créer le budget'}</span>
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
        >
          <X className="h-5 w-5" />
          <span>Annuler</span>
        </button>
      </div>
    </form>
  );
};
