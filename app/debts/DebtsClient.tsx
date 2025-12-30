'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/format';
import {
  projectMultipleDebts,
  calculateAggregateStats,
  type DebtData,
  type DebtProjectionResult,
  type AggregateDebtStats,
} from '@/lib/debt-projection';

interface Debt {
  id: string;
  label: string;
  account: 'SG' | 'FLOA';
  monthly_payment: number;
  remaining_balance: number;
  initial_balance?: number | null;
  interest_rate?: number | null;
  debt_start_date?: string | null;
  start_month: string;
  end_month?: string | null;
  excluded_months?: string[];
  monthly_overrides?: Record<string, number>;
}

interface FormData {
  label: string;
  account: 'SG' | 'FLOA';
  monthly_payment: string;
  remaining_balance: string;
  initial_balance: string;
  interest_rate: string;
  debt_start_date: string;
  start_month: string;
  end_month: string;
}

export default function DebtsClient() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [projections, setProjections] = useState<DebtProjectionResult[]>([]);
  const [aggregateStats, setAggregateStats] = useState<AggregateDebtStats | null>(null);
  const [projectionMonths, setProjectionMonths] = useState<number>(72);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    label: '',
    account: 'SG',
    monthly_payment: '',
    remaining_balance: '',
    initial_balance: '',
    interest_rate: '',
    debt_start_date: '',
    start_month: new Date().toISOString().slice(0, 7),
    end_month: '',
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  useEffect(() => {
    if (debts.length > 0) {
      const debtData: DebtData[] = debts.map((debt) => ({
        id: debt.id,
        label: debt.label,
        monthlyPayment: debt.monthly_payment,
        remainingBalance: debt.remaining_balance,
        initialBalance: debt.initial_balance,
        interestRate: debt.interest_rate,
        startMonth: debt.start_month,
        endMonth: debt.end_month,
        excludedMonths: debt.excluded_months,
        monthlyOverrides: debt.monthly_overrides,
        debtStartDate: debt.debt_start_date,
      }));

      const results = projectMultipleDebts(debtData, projectionMonths);
      setProjections(results);
      setAggregateStats(calculateAggregateStats(results));

      if (!selectedDebt && debts.length > 0) {
        setSelectedDebt(debts[0].id);
      }
    }
  }, [debts, projectionMonths, selectedDebt]);

  async function fetchDebts() {
    try {
      setLoading(true);
      const response = await fetch('/api/debts');

      if (!response.ok) {
        throw new Error('Failed to fetch debts');
      }

      const data = await response.json();
      setDebts(data.debts ?? []);
    } catch (err) {
      console.error('Error fetching debts:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        label: formData.label,
        account: formData.account,
        monthly_payment: parseFloat(formData.monthly_payment),
        remaining_balance: parseFloat(formData.remaining_balance),
        initial_balance: formData.initial_balance ? parseFloat(formData.initial_balance) : null,
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        debt_start_date: formData.debt_start_date || null,
        start_month: formData.start_month,
        end_month: formData.end_month || null,
        excluded_months: [],
        monthly_overrides: {},
      };

      const url = editingId ? `/api/debts?id=${editingId}` : '/api/debts';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save debt');
      }

      await fetchDebts();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        label: '',
        account: 'SG',
        monthly_payment: '',
        remaining_balance: '',
        initial_balance: '',
        interest_rate: '',
        debt_start_date: '',
        start_month: new Date().toISOString().slice(0, 7),
        end_month: '',
      });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dette ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/debts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete debt');
      }

      await fetchDebts();
      if (selectedDebt === id) {
        setSelectedDebt(null);
      }
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function startEdit(debt: Debt) {
    setEditingId(debt.id);
    setFormData({
      label: debt.label,
      account: debt.account,
      monthly_payment: debt.monthly_payment.toString(),
      remaining_balance: debt.remaining_balance.toString(),
      initial_balance: debt.initial_balance?.toString() || '',
      interest_rate: debt.interest_rate?.toString() || '',
      debt_start_date: debt.debt_start_date || '',
      start_month: debt.start_month,
      end_month: debt.end_month || '',
    });
    setShowForm(true);
  }

  function cancelEdit() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      label: '',
      account: 'SG',
      monthly_payment: '',
      remaining_balance: '',
      initial_balance: '',
      interest_rate: '',
      debt_start_date: '',
      start_month: new Date().toISOString().slice(0, 7),
      end_month: '',
    });
  }

  function formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Erreur</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const selectedProjection = projections.find((p) => p.debt.id === selectedDebt);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">💳 Suivi des Dettes</h1>
          <p className="text-gray-600">
            {debts.length > 0
              ? `Projection sur ${projectionMonths} mois de vos ${debts.length} dette${debts.length > 1 ? 's' : ''}`
              : 'Gérez vos dettes et crédits à rembourser'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? 'Annuler' : 'Ajouter une dette'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="mb-8 bg-white border-2 border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Modifier la dette' : 'Nouvelle dette'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la dette <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="label"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Ex: Prêt auto, Crédit immobilier"
                />
              </div>

              <div>
                <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
                  Compte <span className="text-red-500">*</span>
                </label>
                <select
                  id="account"
                  required
                  value={formData.account}
                  onChange={(e) =>
                    setFormData({ ...formData, account: e.target.value as 'SG' | 'FLOA' })
                  }
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="SG">SG</option>
                  <option value="FLOA">FLOA</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="monthly_payment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mensualité (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="monthly_payment"
                  required
                  step="0.01"
                  min="0.01"
                  value={formData.monthly_payment}
                  onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="350.00"
                />
              </div>

              <div>
                <label
                  htmlFor="remaining_balance"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Capital restant (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="remaining_balance"
                  required
                  step="0.01"
                  min="0"
                  value={formData.remaining_balance}
                  onChange={(e) =>
                    setFormData({ ...formData, remaining_balance: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="15000.00"
                />
              </div>

              <div>
                <label
                  htmlFor="initial_balance"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Capital initial (€)
                </label>
                <input
                  type="number"
                  id="initial_balance"
                  step="0.01"
                  min="0"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="20000.00"
                />
              </div>

              <div>
                <label
                  htmlFor="interest_rate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Taux d'intérêt annuel (%)
                </label>
                <input
                  type="number"
                  id="interest_rate"
                  step="0.01"
                  min="0"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="5.5"
                />
              </div>

              <div>
                <label
                  htmlFor="start_month"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Début des paiements <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  id="start_month"
                  required
                  value={formData.start_month}
                  onChange={(e) => setFormData({ ...formData, start_month: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="debt_start_date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date de début du prêt
                </label>
                <input
                  type="date"
                  id="debt_start_date"
                  value={formData.debt_start_date}
                  onChange={(e) => setFormData({ ...formData, debt_start_date: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {debts.length === 0 && !showForm ? (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
          <p className="text-lg text-blue-900 mb-4">Vous n'avez aucune dette enregistrée.</p>
          <p className="text-blue-700 mb-6">
            Ajoutez votre première dette pour commencer à suivre vos remboursements.
          </p>
        </div>
      ) : debts.length > 0 ? (
        <>
          {/* Aggregate Stats */}
          {aggregateStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-red-900 mb-1">Capital Restant Total</div>
                <div className="text-2xl font-bold text-red-700">
                  {formatCurrency(aggregateStats.totalRemainingBalance)}
                </div>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-orange-900 mb-1">Mensualité Totale</div>
                <div className="text-2xl font-bold text-orange-700">
                  {formatCurrency(aggregateStats.totalMonthlyPayment)}
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-yellow-900 mb-1">Intérêts Projetés</div>
                <div className="text-2xl font-bold text-yellow-700">
                  {formatCurrency(aggregateStats.totalProjectedInterest)}
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-green-900 mb-1">
                  {aggregateStats.latestPayoffMonth ? 'Dernier Remboursement' : 'Durée Moyenne'}
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {aggregateStats.latestPayoffMonth
                    ? formatMonth(aggregateStats.latestPayoffMonth)
                    : aggregateStats.averageMonthsRemaining
                    ? `${Math.round(aggregateStats.averageMonthsRemaining)} mois`
                    : 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* Projection Controls */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="font-semibold text-gray-700">Période de projection:</label>
              <select
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(Number(e.target.value))}
                className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value={36}>3 ans (36 mois)</option>
                <option value={48}>4 ans (48 mois)</option>
                <option value={60}>5 ans (60 mois)</option>
                <option value={72}>6 ans (72 mois)</option>
              </select>
            </div>
          </div>

          {/* Debt Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {projections.map((projection) => {
              const debt = debts.find((d) => d.id === projection.debt.id);
              if (!debt) return null;

              const isSelected = projection.debt.id === selectedDebt;
              const progressPercent = projection.debt.initialBalance
                ? ((projection.debt.initialBalance - projection.debt.remainingBalance) /
                    projection.debt.initialBalance) *
                  100
                : 0;

              return (
                <div
                  key={projection.debt.id}
                  className={`p-6 rounded-lg border-2 transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold">{projection.debt.label}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(debt)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(debt.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedDebt(projection.debt.id)}
                    className="w-full text-left"
                  >
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Capital restant:</span>
                        <span className="font-semibold">
                          {formatCurrency(projection.debt.remainingBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Mensualité:</span>
                        <span className="font-semibold">
                          {formatCurrency(projection.debt.monthlyPayment)}
                        </span>
                      </div>
                      {projection.debt.interestRate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Taux d'intérêt:</span>
                          <span className="font-semibold">{projection.debt.interestRate}%</span>
                        </div>
                      )}
                      {projection.estimatedPayoffMonth && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Fin estimée:</span>
                          <span className="font-semibold text-green-600">
                            {formatMonth(projection.estimatedPayoffMonth)}
                          </span>
                        </div>
                      )}
                    </div>

                    {projection.debt.initialBalance && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progression</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Detailed Projection Table */}
          {selectedProjection && (
            <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
                <h2 className="text-xl font-bold">
                  Projection détaillée: {selectedProjection.debt.label}
                </h2>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-semibold">Total des intérêts:</span>{' '}
                    {formatCurrency(selectedProjection.totalInterestPaid)}
                  </div>
                  <div>
                    <span className="font-semibold">Total remboursé:</span>{' '}
                    {formatCurrency(selectedProjection.totalPaid)}
                  </div>
                  {selectedProjection.monthsRemaining && (
                    <div>
                      <span className="font-semibold">Mois restants:</span>{' '}
                      {selectedProjection.monthsRemaining} mois
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Mois
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Solde Début
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Paiement
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Intérêts
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Principal
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Solde Fin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProjection.projections.map((month, idx) => (
                      <tr
                        key={month.month}
                        className={`${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } ${month.isExcluded ? 'opacity-40' : ''} ${
                          month.closingBalance === 0 ? 'bg-green-50 font-semibold' : ''
                        } hover:bg-blue-50 transition`}
                      >
                        <td className="px-4 py-3 text-sm">
                          {formatMonth(month.month)}
                          {month.isExcluded && (
                            <span className="ml-2 text-xs text-red-600">(suspendu)</span>
                          )}
                          {month.isOverride && (
                            <span className="ml-2 text-xs text-blue-600">(modifié)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(month.openingBalance)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {month.payment > 0 ? formatCurrency(month.payment) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          {month.interestCharge > 0 ? formatCurrency(month.interestCharge) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          {month.principalPayment > 0
                            ? formatCurrency(month.principalPayment)
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          {month.closingBalance > 0 ? formatCurrency(month.closingBalance) : '0,00 €'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
