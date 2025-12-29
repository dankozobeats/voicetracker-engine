'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format';

type Transaction = {
  id: string;
  date: string;
  label: string;
  amount: number;
  category: string;
  account: 'SG' | 'FLOA';
  type: 'INCOME' | 'EXPENSE';
  is_deferred: boolean;
  deferred_to: string | null;
  priority: number;
  budget_id: string | null;
};

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

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
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

              if (isEditing) {
                return (
                  <tr key={transaction.id} className="bg-blue-50">
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
                <tr key={transaction.id} className="hover:bg-slate-50">
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
  );
}
