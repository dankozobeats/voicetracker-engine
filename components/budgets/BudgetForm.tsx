'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

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
      // Récupérer l'utilisateur connecté
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Vous devez être connecté pour créer un budget');
        setLoading(false);
        return;
      }

      // Préparer le payload
      const payload: Record<string, unknown> = {
        category: formData.category,
        amount: formData.amount,
        period: formData.period,
      };

      // Ajouter les dates seulement si elles sont renseignées
      if (formData.startDate) {
        payload.startDate = formData.startDate;
      }
      if (formData.endDate) {
        payload.endDate = formData.endDate;
      }

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Erreur lors de l&apos;enregistrement du budget');
      }

      // Succès : rediriger vers /budgets
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">
          Catégorie <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="category"
          name="category"
          required
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
          placeholder="Ex: Alimentation, Transport..."
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
          Montant <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          required
          min="0.01"
          step="0.01"
          value={formData.amount === 0 ? '' : formData.amount}
          onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="period" className="block text-sm font-medium text-slate-700">
          Période <span className="text-red-500">*</span>
        </label>
        <select
          id="period"
          name="period"
          required
          value={formData.period}
          onChange={(e) => handleChange('period', e.target.value as 'MONTHLY' | 'ROLLING' | 'MULTI')}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
        >
          <option value="MONTHLY">Mensuel</option>
          <option value="ROLLING">Glissant</option>
          <option value="MULTI">Multi-mois</option>
        </select>
      </div>

      {isMultiPeriod && (
        <>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">
              Date de début <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              required={isMultiPeriod}
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">
              Date de fin <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              required={isMultiPeriod}
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
            />
          </div>
        </>
      )}

      {!isMultiPeriod && (
        <>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">
              Date de début (optionnel)
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">
              Date de fin (optionnel)
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
};

