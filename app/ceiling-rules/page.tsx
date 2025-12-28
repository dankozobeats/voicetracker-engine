'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format';

interface CeilingRule {
  id: string;
  label: string;
  amount: number;
  account: 'SG' | 'FLOA';
  start_month: string;
  end_month: string | null;
}

interface FormData {
  label: string;
  amount: number;
  account: 'SG' | 'FLOA';
  start_month: string;
  end_month: string;
}

export default function CeilingRulesPage() {
  const [rules, setRules] = useState<CeilingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    label: '',
    amount: 0,
    account: 'SG',
    start_month: new Date().toISOString().split('T')[0].slice(0, 7), // YYYY-MM
    end_month: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRules = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Vous devez être connecté');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/ceiling-rules');

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des plafonds');
      }

      const data = (await response.json()) as { ceilingRules: CeilingRule[] };
      setRules(data.ceilingRules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/ceiling-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: formData.label,
          amount: formData.amount,
          account: formData.account,
          start_month: formData.start_month,
          end_month: formData.end_month || null,
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
        start_month: new Date().toISOString().split('T')[0].slice(0, 7),
        end_month: '',
      });
      setShowForm(false);
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plafond ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ceiling-rules?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await fetchRules();
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
            <h1 className="text-3xl font-bold text-slate-900">Plafonds de dépenses</h1>
            <p className="mt-2 text-slate-600">
              Définissez des limites maximales de dépenses par mois
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? 'Annuler' : 'Ajouter un plafond'}
          </button>
        </header>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Nouveau plafond</h2>

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
                placeholder="Ex: Plafond loisirs, Budget voyage..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
                  Montant maximum <span className="text-red-500">*</span>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_month" className="block text-sm font-medium text-slate-700">
                  Mois de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  id="start_month"
                  required
                  value={formData.start_month}
                  onChange={(e) => setFormData({ ...formData, start_month: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                />
              </div>

              <div>
                <label htmlFor="end_month" className="block text-sm font-medium text-slate-700">
                  Mois de fin (optionnel)
                </label>
                <input
                  type="month"
                  id="end_month"
                  value={formData.end_month}
                  onChange={(e) => setFormData({ ...formData, end_month: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                />
              </div>
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

        {rules.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Aucun plafond défini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{rule.label}</h3>
                  <div className="mt-1 flex gap-4 text-sm text-slate-600">
                    <span>Plafond: {formatCurrency(rule.amount)}</span>
                    <span>Compte: {rule.account}</span>
                    <span>
                      Depuis: {new Date(rule.start_month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                    {rule.end_month && (
                      <span>
                        Jusqu&apos;à: {new Date(rule.end_month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(rule.id)}
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
