'use client';

import React, { useEffect, useState } from 'react';

interface ChecklistItem {
  id: string;
  label: string;
  type: 'transaction' | 'recurring' | 'balance' | 'other';
  amount?: number;
  date?: string;
  account?: 'SG' | 'FLOA';
  completed: boolean;
  createdAt: string;
}

interface FormData {
  label: string;
  type: 'transaction' | 'recurring' | 'balance' | 'other';
  amount: string;
  date: string;
  account: 'SG' | 'FLOA';
}

const STORAGE_KEY = 'import-checklist-items';

export default function ImportChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    // Initialisation depuis localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as ChecklistItem[];
        } catch (err) {
          console.error('Failed to load checklist items:', err);
        }
      }
    }
    return [];
  });
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    label: '',
    type: 'transaction',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    account: 'SG',
  });

  // Sauvegarder dans localStorage
  const saveItems = (newItems: ChecklistItem[]) => {
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      label: formData.label,
      type: formData.type,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      date: formData.date || undefined,
      account: formData.account,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    saveItems([...items, newItem]);

    // Réinitialiser le formulaire
    setFormData({
      label: '',
      type: 'transaction',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      account: 'SG',
    });
    setShowForm(false);
  };

  const toggleComplete = (id: string) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveItems(updatedItems);
  };

  const deleteItem = (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      return;
    }
    const updatedItems = items.filter((item) => item.id !== id);
    saveItems(updatedItems);
  };

  const clearCompleted = () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer tous les éléments cochés ?')) {
      return;
    }
    const updatedItems = items.filter((item) => !item.completed);
    saveItems(updatedItems);
  };

  const pendingItems = items.filter((item) => !item.completed);
  const completedItems = items.filter((item) => item.completed);

  const stats = {
    total: items.length,
    pending: pendingItems.length,
    completed: completedItems.length,
    byType: {
      transaction: items.filter((i) => i.type === 'transaction' && !i.completed).length,
      recurring: items.filter((i) => i.type === 'recurring' && !i.completed).length,
      balance: items.filter((i) => i.type === 'balance' && !i.completed).length,
      other: items.filter((i) => i.type === 'other' && !i.completed).length,
    },
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      transaction: 'Transaction',
      recurring: 'Charge récurrente',
      balance: 'Solde d\'ouverture',
      other: 'Autre',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      transaction: 'bg-blue-100 text-blue-800',
      recurring: 'bg-purple-100 text-purple-800',
      balance: 'bg-green-100 text-green-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Checklist d&apos;import</h1>
            <p className="mt-2 text-slate-600">
              Suivez les données que vous avez importées depuis votre fichier Excel
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? 'Annuler' : 'Ajouter un élément'}
          </button>
        </header>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-600">
              {stats.pending} à faire · {stats.completed} fait{stats.completed > 1 ? 's' : ''}
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-700">Transactions</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{stats.byType.transaction}</p>
            <p className="mt-1 text-xs text-blue-600">À importer</p>
          </div>

          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-purple-700">Charges récurrentes</p>
            <p className="mt-2 text-2xl font-bold text-purple-600">{stats.byType.recurring}</p>
            <p className="mt-1 text-xs text-purple-600">À configurer</p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-green-700">Soldes</p>
            <p className="mt-2 text-2xl font-bold text-green-600">{stats.byType.balance}</p>
            <p className="mt-1 text-xs text-green-600">À définir</p>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Nouvel élément</h2>

            <div>
              <label htmlFor="label" className="block text-sm font-medium text-slate-700">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="label"
                required
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                placeholder="Ex: Salaire novembre, Loyer décembre..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-700">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as FormData['type'] })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                >
                  <option value="transaction">Transaction</option>
                  <option value="recurring">Charge récurrente</option>
                  <option value="balance">Solde d&apos;ouverture</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="account" className="block text-sm font-medium text-slate-700">
                  Compte
                </label>
                <select
                  id="account"
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
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
                  Montant (optionnel)
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700">
                  Date (optionnel)
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                Ajouter
              </button>
            </div>
          </form>
        )}

        {/* Actions */}
        {items.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                Afficher les éléments cochés ({completedItems.length})
              </label>
            </div>

            {completedItems.length > 0 && (
              <button
                onClick={clearCompleted}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Supprimer les éléments cochés
              </button>
            )}
          </div>
        )}

        {/* Liste des éléments */}
        {items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Aucun élément dans la checklist.</p>
            <p className="mt-2 text-sm text-slate-500">
              Ajoutez les éléments de votre fichier Excel pour suivre votre progression.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleComplete(item.id)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{item.label}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-sm text-slate-600">
                    {item.amount && <span>{item.amount.toFixed(2)} €</span>}
                    {item.date && <span>{new Date(item.date).toLocaleDateString('fr-FR')}</span>}
                    <span>Compte: {item.account}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            ))}

            {showCompleted && completedItems.length > 0 && (
              <>
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Éléments cochés ({completedItems.length})
                  </h3>
                </div>
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 opacity-60"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleComplete(item.id)}
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-700 line-through">{item.label}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(item.type)}`}>
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      <div className="mt-1 flex gap-4 text-sm text-slate-500">
                        {item.amount && <span>{item.amount.toFixed(2)} €</span>}
                        {item.date && <span>{new Date(item.date).toLocaleDateString('fr-FR')}</span>}
                        <span>Compte: {item.account}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
