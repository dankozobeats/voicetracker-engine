'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format';
import type { Transaction } from '@/lib/types';

// Transaction type removed, using import from @/lib/types

type Budget = {
  id: string;
  category: string;
  amount: number;
  period: 'MONTHLY' | 'ROLLING' | 'MULTI';
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export function TransactionsClient({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [verifiedTransactions, setVerifiedTransactions] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);
  const isFirstRender = useRef(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);

  // Charger les données après l'hydratation pour éviter le mismatch
  useEffect(() => {
    const stored = localStorage.getItem('verifiedTransactions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setVerifiedTransactions(new Set(parsed));
      } catch (err) {
        console.error('Erreur lors du chargement des transactions vérifiées:', err);
      }
    }
    setIsHydrated(true);
    isFirstRender.current = false;
  }, []);

  // Sauvegarder les transactions vérifiées dans localStorage
  useEffect(() => {
    // Ne pas sauvegarder au premier rendu
    if (!isFirstRender.current) {
      localStorage.setItem('verifiedTransactions', JSON.stringify(Array.from(verifiedTransactions)));
    }
  }, [verifiedTransactions]);

  // Charger les transactions filtrées par mois
  const fetchTransactionsByMonth = async (month: string) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Calculer le début et la fin du mois
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (!error && data) {
        setTransactions(data as Transaction[]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des transactions:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Recharger les transactions quand le mois change
  useEffect(() => {
    fetchTransactionsByMonth(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const toggleVerified = (id: string) => {
    const newSet = new Set(verifiedTransactions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVerifiedTransactions(newSet);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Retirer la transaction de la liste
      setTransactions(transactions.filter((t) => t.id !== id));

      // Retirer aussi de la liste des vérifiées
      const newSet = new Set(verifiedTransactions);
      newSet.delete(id);
      setVerifiedTransactions(newSet);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      date: transaction.date,
      label: transaction.label,
      amount: transaction.amount,
      category: transaction.category,
      account: transaction.account,
      type: transaction.type,
      is_deferred: transaction.is_deferred,
      deferred_to: transaction.deferred_to,
      priority: transaction.priority,
      budget_id: transaction.budget_id,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editForm.date,
          label: editForm.label,
          amount: editForm.amount,
          category: editForm.category,
          account: editForm.account,
          type: editForm.type,
          is_deferred: editForm.is_deferred,
          deferred_to: editForm.deferred_to,
          priority: editForm.priority,
          budget_id: editForm.budget_id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const updatedTransaction = await response.json();

      // Mettre à jour la transaction dans la liste
      setTransactions(transactions.map((t) =>
        t.id === id ? { ...t, ...editForm } : t
      ));

      setEditingId(null);
      setEditForm({});
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  // Fonctions de navigation de mois
  const goToPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonthDisplay = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const isCurrentMonth = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return selectedMonth === currentMonth;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sélecteur de mois */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-slate-50 border border-slate-200 px-3 sm:px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-xs sm:text-sm font-medium text-slate-700">Période:</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={goToPreviousMonth}
              className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-200"
              title="Mois précédent"
            >
              ←
            </button>
            <span className="flex-1 sm:min-w-[180px] text-center text-base sm:text-lg font-semibold text-slate-900 capitalize">
              {formatMonthDisplay(selectedMonth)}
            </span>
            <button
              onClick={goToNextMonth}
              className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-200"
              title="Mois suivant"
            >
              →
            </button>
          </div>
        </div>
        {!isCurrentMonth() && (
          <button
            onClick={goToCurrentMonth}
            className="w-full sm:w-auto rounded-lg bg-blue-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-blue-700"
          >
            Mois actuel
          </button>
        )}
      </div>

      {/* Indicateur de chargement */}
      {loading && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-center">
          <p className="text-sm text-blue-800">Chargement des transactions...</p>
        </div>
      )}

      {/* Tableau des transactions - Desktop uniquement */}
      <div className="hidden lg:block rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700">
                  ✓
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Libellé
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Budget
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Compte
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
                  Montant
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700">
                  Différé
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {transactions.map((transaction) => {
                const isEditing = editingId === transaction.id;
                const isVerified = verifiedTransactions.has(transaction.id);

                if (isEditing) {
                  return (
                    <tr key={transaction.id} className="bg-blue-50">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isVerified}
                          onChange={() => toggleVerified(transaction.id)}
                          className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="date"
                          value={editForm.date || ''}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          value={editForm.label || ''}
                          onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={editForm.budget_id || ''}
                          onChange={(e) => setEditForm({ ...editForm, budget_id: e.target.value || null })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="">Aucun budget</option>
                          {budgets.map((budget) => (
                            <option key={budget.id} value={budget.id}>
                              {budget.category}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={editForm.account || 'SG'}
                          onChange={(e) => setEditForm({ ...editForm, account: e.target.value as 'SG' | 'FLOA' })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="SG">SG</option>
                          <option value="FLOA">FLOA</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={editForm.type || 'EXPENSE'}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="INCOME">Revenu</option>
                          <option value="EXPENSE">Dépense</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.amount || 0}
                          onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-right"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={editForm.is_deferred || false}
                              onChange={(e) => setEditForm({ ...editForm, is_deferred: e.target.checked })}
                            />
                            Différé
                          </label>
                          {editForm.is_deferred && (
                            <>
                              <input
                                type="month"
                                value={editForm.deferred_to || ''}
                                onChange={(e) => setEditForm({ ...editForm, deferred_to: e.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              />
                              <input
                                type="number"
                                min="1"
                                max="9"
                                value={editForm.priority || 9}
                                onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) })}
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                                placeholder="Priorité (1-9)"
                              />
                            </>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleUpdate(transaction.id)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={transaction.id}
                    className={`${isHydrated && isVerified ? 'bg-slate-100 opacity-60' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isVerified}
                        onChange={() => toggleVerified(transaction.id)}
                        className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {transaction.label}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {transaction.category}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {transaction.budget_id ? (
                        <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
                          {budgets.find((b) => b.id === transaction.budget_id)?.category || 'Budget'}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        {transaction.account}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {transaction.type === 'INCOME' ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Revenu
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                          Dépense
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold">
                      <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm">
                      {transaction.is_deferred ? (
                        <div className="text-xs">
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                            {transaction.deferred_to}
                          </span>
                          <div className="mt-1 text-slate-500">
                            Priorité: {transaction.priority}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => startEdit(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          disabled={deletingId === transaction.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deletingId === transaction.id ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {transactions.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">
              Total: {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Cards pour mobile - Affichage mobile uniquement */}
      <div className="lg:hidden space-y-4">
        {transactions.map((transaction) => {
          const isVerified = verifiedTransactions.has(transaction.id);
          const isIncome = transaction.type === 'INCOME';

          return (
            <div
              key={transaction.id}
              className={`rounded-[24px] border-2 bg-white p-5 shadow-xl transition-all duration-300 ${isHydrated && isVerified
                ? 'opacity-60 grayscale-[0.5] border-slate-100 shadow-none scale-[0.98]'
                : 'border-slate-50 shadow-slate-200/40 hover:shadow-slate-300/50'
                }`}
            >
              {/* Header de la card */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="relative mt-1">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={() => toggleVerified(transaction.id)}
                      className="h-5 w-5 rounded-lg border-2 border-slate-200 text-slate-900 focus:ring-slate-900/20 transition-all cursor-pointer"
                    />
                    {isVerified && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-2 w-2 rounded-full bg-slate-900" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-base leading-tight truncate">{transaction.label}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-lg font-black tracking-tight ${isIncome ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>

              {/* Détails en badge grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Catégorie</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{transaction.category}</p>
                </div>
                <div className={`rounded-xl border p-2 ${transaction.account === 'SG' ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'}`}>
                  <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${transaction.account === 'SG' ? 'text-indigo-600' : 'text-amber-600'}`}>Compte</p>
                  <p className={`text-xs font-bold ${transaction.account === 'SG' ? 'text-indigo-900' : 'text-amber-900'}`}>{transaction.account}</p>
                </div>
                {transaction.budget_id && (
                  <div className="col-span-2 rounded-xl bg-purple-50 border border-purple-100 p-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-purple-600 mb-0.5">Budget</p>
                    <p className="text-xs font-bold text-purple-900 truncate">
                      {budgets.find((b) => b.id === transaction.budget_id)?.category || 'Budget'}
                    </p>
                  </div>
                )}
                {transaction.is_deferred && (
                  <div className="col-span-2 rounded-xl bg-orange-50 border border-orange-100 p-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-orange-600 mb-0.5">Différé ({transaction.deferred_to})</p>
                    <p className="text-xs font-bold text-orange-900">
                      Priorité {transaction.priority}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <button
                  onClick={() => startEdit(transaction)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(transaction.id)}
                  disabled={deletingId === transaction.id}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-rose-100 hover:text-rose-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  {deletingId === transaction.id ? '...' : 'Supprimer'}
                </button>
              </div>
            </div>
          );
        })}

        {transactions.length > 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-center">
            <p className="text-xs text-slate-600">
              {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
