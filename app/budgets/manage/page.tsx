'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type BudgetPeriod = 'MONTHLY' | 'ROLLING' | 'MULTI';

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string | null;
  end_date: string | null;
  window_months: number | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

interface BudgetFormData {
  category: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  window_months: number;
  period_start: string;
  period_end: string;
}

interface RecurringCharge {
  id: string;
  label: string;
  amount: number;
  account: string;
  type: string;
}

interface BudgetWithCharges extends Budget {
  charges: RecurringCharge[];
  totalCharges: number;
  remainingBudget: number;
}

const DEFAULT_CATEGORIES = [
  'Courses',
  'Restaurants',
  'Transport',
  'Loisirs',
  'Santé',
  'Vêtements',
  'Logement',
  'Énergie',
  'Assurances',
  'Télécom',
  'Autre',
];

export default function ManageBudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithCharges[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [availableCharges, setAvailableCharges] = useState<RecurringCharge[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<BudgetFormData>({
    category: '',
    amount: 0,
    period: 'MONTHLY',
    start_date: '',
    end_date: '',
    window_months: 3,
    period_start: '',
    period_end: '',
  });

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...budgets.map((b) => b.category)])
  ).sort();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatPeriodLabel = (budget: Budget): string => {
    if (budget.period === 'MONTHLY') return 'Mensuel';
    if (budget.period === 'ROLLING') return `Glissant (${budget.window_months} mois)`;
    if (budget.period === 'MULTI' && budget.period_start && budget.period_end) {
      return `${budget.period_start} → ${budget.period_end}`;
    }
    return 'Multi-mois';
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/budgets/manage');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erreur lors du chargement');

      // Pour chaque budget, récupérer les charges affectées
      const budgetsWithCharges = await Promise.all(
        data.budgets.map(async (budget: Budget) => {
          const chargesResponse = await fetch(`/api/budgets/${budget.id}/charges`);
          const chargesData = await chargesResponse.json();

          const charges = chargesData.charges || [];
          const totalCharges = charges.reduce((sum: number, c: RecurringCharge) => sum + c.amount, 0);
          const remainingBudget = budget.amount - totalCharges;

          return {
            ...budget,
            charges,
            totalCharges,
            remainingBudget,
          };
        })
      );

      setBudgets(budgetsWithCharges);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      category: formData.category,
      amount: formData.amount,
      period: formData.period,
    };

    if (formData.period === 'ROLLING') {
      payload.window_months = formData.window_months;
    } else if (formData.period === 'MULTI') {
      payload.period_start = formData.period_start;
      payload.period_end = formData.period_end;
    }

    try {
      const url = editingId ? `/api/budgets/manage?id=${editingId}` : '/api/budgets/manage';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      await fetchBudgets();
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingId(budget.id);
    setFormData({
      category: budget.category,
      amount: budget.amount,
      period: budget.period,
      start_date: budget.start_date || '',
      end_date: budget.end_date || '',
      window_months: budget.window_months || 3,
      period_start: budget.period_start || '',
      period_end: budget.period_end || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) return;

    try {
      const response = await fetch(`/api/budgets/manage?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      await fetchBudgets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      amount: 0,
      period: 'MONTHLY',
      start_date: '',
      end_date: '',
      window_months: 3,
      period_start: '',
      period_end: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openAssignChargesModal = async (budgetId: string) => {
    setSelectedBudgetId(budgetId);

    // Récupérer toutes les charges EXPENSE disponibles
    try {
      const response = await fetch('/api/recurring-charges');
      const data = await response.json();
      const allExpenses = data.recurringCharges.filter((c: RecurringCharge) => c.type === 'EXPENSE');

      // Récupérer tous les IDs de charges déjà affectées à des budgets
      const assignedChargeIds = new Set<string>();
      budgets.forEach((budget) => {
        budget.charges.forEach((charge) => {
          assignedChargeIds.add(charge.id);
        });
      });

      // Filtrer pour ne garder que les charges non encore affectées
      const unassignedCharges = allExpenses.filter(
        (charge: RecurringCharge) => !assignedChargeIds.has(charge.id)
      );

      setAvailableCharges(unassignedCharges);
      setShowAssignModal(true);
    } catch (err) {
      alert('Erreur lors du chargement des charges récurrentes');
    }
  };

  const handleAssignCharge = async (chargeId: string) => {
    if (!selectedBudgetId) return;

    setAssigning(true);
    try {
      const response = await fetch(`/api/budgets/${selectedBudgetId}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recurringChargeId: chargeId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'affectation');
      }

      // Trouver le nom de la charge pour le message
      const assignedCharge = availableCharges.find((c) => c.id === chargeId);

      // Retirer immédiatement la charge de la liste disponible
      setAvailableCharges((prev) => prev.filter((c) => c.id !== chargeId));

      // Rafraîchir les budgets pour voir la mise à jour
      await fetchBudgets();

      // Afficher un message de succès
      if (assignedCharge) {
        setSuccessMessage(`✓ ${assignedCharge.label} affectée avec succès`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }

      // Fermer le modal si plus aucune charge disponible
      if (availableCharges.length <= 1) {
        setShowAssignModal(false);
        setSelectedBudgetId(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'affectation');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveCharge = async (budgetId: string, chargeId: string) => {
    if (!confirm('Retirer cette charge du budget ?')) return;

    try {
      const response = await fetch(`/api/budgets/${budgetId}/charges?recurringChargeId=${chargeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du retrait');
      }

      await fetchBudgets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du retrait');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-600">Chargement des budgets...</p>
      </div>
    );
  }

  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);

  return (
    <main className="container mx-auto p-6 max-w-6xl">
      <section className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gérer mes budgets</h1>
            <p className="text-slate-600 mt-1">
              Définissez vos budgets et affectez-y vos charges récurrentes
            </p>
          </div>
          <Link
            href="/budgets"
            className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 hover:bg-slate-200"
          >
            Voir les résultats
          </Link>
        </div>
      </section>

      {/* Formulaire */}
      <section className="mb-8">
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="w-full rounded-lg bg-slate-900 px-4 py-3 text-left font-medium text-white hover:bg-slate-800"
        >
          {showForm ? '✕ Annuler' : '+ Nouveau budget'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? 'Modifier le budget' : 'Nouveau budget'}
            </h2>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={allCategories.includes(formData.category) ? formData.category : '__custom__'}
                onChange={(e) => {
                  if (e.target.value !== '__custom__') {
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
              >
                <option value="">Sélectionner...</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__custom__">➕ Autre (tapez ci-dessous)</option>
              </select>
              {(!allCategories.includes(formData.category) || formData.category === '') && (
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Tapez une nouvelle catégorie..."
                  className="mt-2 block w-full rounded-md border border-green-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 bg-green-50"
                />
              )}
            </div>

            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Montant du budget <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
              />
            </div>

            {/* Période */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Période <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as BudgetPeriod })}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
              >
                <option value="MONTHLY">Mensuel</option>
                <option value="ROLLING">Glissant (X mois)</option>
                <option value="MULTI">Multi-mois (période fixe)</option>
              </select>
            </div>

            {formData.period === 'ROLLING' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de mois glissants
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.window_months}
                  onChange={(e) => setFormData({ ...formData, window_months: parseInt(e.target.value) || 3 })}
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                />
              </div>
            )}

            {formData.period === 'MULTI' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    required
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    required
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
              >
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Liste des budgets */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Budgets configurés ({budgets.length})
        </h2>

        {budgets.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-slate-600">Aucun budget configuré. Créez votre premier budget ci-dessus.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="rounded-lg border border-slate-200 bg-white p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">{budget.category}</h3>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {formatPeriodLabel(budget)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Budget total</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(budget.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Charges fixes</p>
                        <p className="text-lg font-semibold text-orange-600">{formatCurrency(budget.totalCharges)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Reste disponible</p>
                        <p className={`text-lg font-semibold ${budget.remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(budget.remainingBudget)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Charges affectées */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-700">
                      Charges récurrentes affectées ({budget.charges.length})
                    </h4>
                    <button
                      onClick={() => openAssignChargesModal(budget.id)}
                      className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
                    >
                      + Affecter une charge
                    </button>
                  </div>

                  {budget.charges.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Aucune charge affectée</p>
                  ) : (
                    <div className="space-y-2">
                      {budget.charges.map((charge) => (
                        <div
                          key={charge.id}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-900">{charge.label}</span>
                            <span className="text-xs text-slate-500">{charge.account}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-900">{formatCurrency(charge.amount)}</span>
                            <button
                              onClick={() => handleRemoveCharge(budget.id, charge.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal d'affectation */}
      {showAssignModal && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Affecter des charges au budget "{selectedBudget.category}"
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Budget restant: {formatCurrency(selectedBudget.remainingBudget)}
              </p>
              {successMessage && (
                <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">
                  {successMessage}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {availableCharges.length === 0 ? (
                <p className="text-center text-slate-600 py-8">
                  Toutes les charges récurrentes sont déjà affectées à des budgets.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 mb-4">
                    {availableCharges.length} charge{availableCharges.length > 1 ? 's' : ''} disponible{availableCharges.length > 1 ? 's' : ''}
                  </p>
                  {availableCharges.map((charge) => (
                    <div
                      key={charge.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
                    >
                      <div>
                        <h3 className="font-medium text-slate-900">{charge.label}</h3>
                        <p className="text-sm text-slate-600">{charge.account}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900">{formatCurrency(charge.amount)}</span>
                        <button
                          onClick={() => handleAssignCharge(charge.id)}
                          disabled={assigning}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Affecter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedBudgetId(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
