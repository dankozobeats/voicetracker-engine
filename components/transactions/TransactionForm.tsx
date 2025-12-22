'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface TransactionFormData {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  occurredAt: string; // YYYY-MM-DD
}

export const TransactionForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TransactionFormData>({
    amount: 0,
    type: 'expense',
    category: '',
    occurredAt: new Date().toISOString().split('T')[0], // Date du jour par défaut
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
        setError('Vous devez être connecté pour ajouter une transaction');
        setLoading(false);
        return;
      }

      // Mapper les champs du formulaire vers le format attendu par l'API
      // L'API attend: userId, date, label, amount, category
      // Pour le label, on utilise le type comme label simple
      // Pour l'amount, on garde la valeur positive (l'API gère le signe si nécessaire)
      const payload = {
        userId: user.id,
        date: formData.occurredAt,
        label: formData.type === 'income' ? 'Revenu' : 'Dépense',
        amount: formData.amount,
        category: formData.category,
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

  const handleChange = (field: keyof TransactionFormData, value: string | number) => {
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
        <label htmlFor="type" className="block text-sm font-medium text-slate-700">
          Type <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          required
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value as 'income' | 'expense')}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
        >
          <option value="expense">Dépense</option>
          <option value="income">Revenu</option>
        </select>
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

