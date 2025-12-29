'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

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
  budgetId?: string; // Lien vers un budget
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
    occurredAt: new Date().toISOString().split('T')[0], // Date du jour par défaut
    account: 'SG',
    label: '',
    isDeferred: false,
    priority: 9,
    budgetId: '',
  });

  // Charger les budgets au montage
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error: fetchError } = await supabase
          .from('budgets')
          .select('id, category, amount, period')
          .eq('user_id', user.id)
          .order('category', { ascending: true });

        if (!fetchError && data) {
          setBudgets(data as Budget[]);
        }
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
      // Récupérer l'utilisateur connecté
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Vous devez être connecté pour ajouter une transaction');
        setLoading(false);
        return;
      }

      // Mapper les champs du formulaire vers le format attendu par l'API
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Erreur lors de l&apos;enregistrement de la transaction');
      }

      // Succès : rediriger vers /analysis
      router.push('/analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof TransactionFormData, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
          Montant <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          required
          min="0"
          step="0.01"
          value={formData.amount === 0 ? '' : formData.amount}
          onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="label" className="block text-sm font-medium text-slate-700">
          Libellé
        </label>
        <input
          type="text"
          id="label"
          name="label"
          value={formData.label}
          onChange={(e) => handleChange('label', e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
          placeholder="Ex: Courses du mois, Loyer..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-700">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            required
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value as 'INCOME' | 'EXPENSE')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
          >
            <option value="EXPENSE">Dépense</option>
            <option value="INCOME">Revenu</option>
          </select>
        </div>

        <div>
          <label htmlFor="account" className="block text-sm font-medium text-slate-700">
            Compte <span className="text-red-500">*</span>
          </label>
          <select
            id="account"
            name="account"
            required
            value={formData.account}
            onChange={(e) => handleChange('account', e.target.value as 'SG' | 'FLOA')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
          >
            <option value="SG">SG</option>
            <option value="FLOA">FLOA</option>
          </select>
        </div>
      </div>

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
          placeholder="Ex: Alimentation, Transport, Salaire..."
        />
      </div>

      {/* Section Budget */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
        <label htmlFor="budgetId" className="block text-sm font-medium text-blue-900 mb-1">
          Lier à un budget (optionnel)
        </label>
        <p className="text-xs text-blue-700 mb-3">
          Associez cette transaction à un de vos budgets pour suivre vos dépenses
        </p>
        {loadingBudgets ? (
          <p className="text-sm text-blue-600">Chargement des budgets...</p>
        ) : budgets.length === 0 ? (
          <div className="text-sm text-blue-800">
            <p className="mb-2">Aucun budget créé.</p>
            <a
              href="/budgets/manage"
              className="inline-block rounded-md bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
            >
              Créer un budget
            </a>
          </div>
        ) : (
          <select
            id="budgetId"
            name="budgetId"
            value={formData.budgetId || ''}
            onChange={(e) => handleChange('budgetId', e.target.value)}
            className="block w-full rounded-md border border-blue-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Aucun budget</option>
            {budgets.map((budget) => (
              <option key={budget.id} value={budget.id}>
                {budget.category} - {budget.amount}€ ({budget.period === 'MONTHLY' ? 'Mensuel' : budget.period === 'ROLLING' ? 'Glissant' : 'Multi-mois'})
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="occurredAt" className="block text-sm font-medium text-slate-700">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="occurredAt"
          name="occurredAt"
          required
          value={formData.occurredAt}
          onChange={(e) => handleChange('occurredAt', e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
        />
      </div>

      {/* Section Différé */}
      <div className="border-t border-slate-200 pt-6">
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isDeferred}
              onChange={(e) => handleChange('isDeferred', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />
            <span className="text-sm font-medium text-slate-700">Transaction différée</span>
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Cochez cette case pour reporter le paiement à un mois ultérieur
          </p>
        </div>

        {formData.isDeferred && (
          <div className="space-y-4 rounded-md bg-slate-50 p-4">
            <div>
              <label htmlFor="deferredTo" className="block text-sm font-medium text-slate-700">
                Reporter au mois <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                id="deferredTo"
                name="deferredTo"
                required={formData.isDeferred}
                value={formData.deferredTo || ''}
                onChange={(e) => handleChange('deferredTo', e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">Format: YYYY-MM</p>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-700">
                Priorité (1-9) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="priority"
                name="priority"
                required={formData.isDeferred}
                min="1"
                max="9"
                value={formData.priority || 9}
                onChange={(e) => handleChange('priority', parseInt(e.target.value) || 9)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                1 = priorité maximale, 9 = priorité minimale
              </p>
            </div>
          </div>
        )}
      </div>

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

