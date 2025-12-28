'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format';

interface AccountBalance {
  id: string;
  account: 'SG' | 'FLOA';
  month: string;
  opening_balance: number;
}

interface FormData {
  account: 'SG' | 'FLOA';
  month: string;
  opening_balance: number;
}

export default function AccountBalancesPage() {
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    account: 'SG',
    month: new Date().toISOString().split('T')[0].slice(0, 7), // YYYY-MM
    opening_balance: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchBalances = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Vous devez être connecté');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/account-balances');

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des soldes');
      }

      const data = (await response.json()) as { accountBalances: AccountBalance[] };
      setBalances(data.accountBalances || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/account-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: formData.account,
          month: formData.month,
          opening_balance: formData.opening_balance,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Erreur lors de la sauvegarde');
      }

      // Réinitialiser le formulaire et recharger les données
      setFormData({
        account: 'SG',
        month: new Date().toISOString().split('T')[0].slice(0, 7),
        opening_balance: 0,
      });
      setShowForm(false);
      await fetchBalances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce solde ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/account-balances?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await fetchBalances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

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
            <h1 className="text-3xl font-bold text-slate-900">Soldes d&apos;ouverture</h1>
            <p className="mt-2 text-slate-600">
              Définissez le solde de départ de vos comptes pour chaque mois
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? 'Annuler' : 'Définir un solde'}
          </button>
        </header>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Nouveau solde d&apos;ouverture</h2>

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label htmlFor="month" className="block text-sm font-medium text-slate-700">
                  Mois <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  id="month"
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="opening_balance" className="block text-sm font-medium text-slate-700">
                Solde d&apos;ouverture <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="opening_balance"
                required
                step="0.01"
                value={formData.opening_balance === 0 ? '' : formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                placeholder="Ex: 1500.00"
              />
              <p className="mt-1 text-xs text-slate-500">
                Le solde au début du mois, avant les transactions
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}

        {balances.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Aucun solde défini.</p>
            <p className="mt-2 text-sm text-slate-500">
              Par défaut, le moteur utilise un solde de 0€ si aucun solde n&apos;est défini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {balances.map((balance) => (
              <div
                key={balance.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">
                    Compte {balance.account} - {new Date(balance.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="mt-1 text-sm text-slate-600">
                    Solde d&apos;ouverture: <span className="font-medium">{formatCurrency(balance.opening_balance)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(balance.id)}
                  className="rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
