'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  PieChart,
  TrendingDown,
  TrendingUp,
  ArrowLeft,
  Search,
  Settings2,
  Trash2,
  Edit3,
  Link as LinkIcon,
  X,
  Target,
  Wallet,
  Activity,
  History,
  ShoppingCart,
  Car,
  Heart,
  Home,
  Zap,
  Phone,
  Gamepad2,
  ShieldCheck,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BudgetModal } from '@/components/budgets/BudgetModal';

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

interface Transaction {
  id: string;
  label: string;
  amount: number;
  date: string;
  category: string;
  account: string;
  type: string;
}

interface BudgetWithCharges extends Budget {
  charges: RecurringCharge[];
  transactions: Transaction[];
  totalCharges: number;
  totalTransactions: number;
  totalSpent: number;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCharges, setExpandedCharges] = useState<Set<string>>(new Set());

  // État pour le mois sélectionné (format YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

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

  const fetchBudgets = async (month: string = selectedMonth) => {
    try {
      setLoading(true);
      const response = await fetch('/api/budgets/manage');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erreur lors du chargement');

      // Pour chaque budget, récupérer les charges ET les transactions
      const budgetsWithCharges = await Promise.all(
        data.budgets.map(async (budget: Budget) => {
          // Récupérer les charges récurrentes
          const chargesResponse = await fetch(`/api/budgets/${budget.id}/charges`);
          const chargesData = await chargesResponse.json();
          const charges = chargesData.charges || [];
          const totalCharges = charges.reduce((sum: number, c: RecurringCharge) => sum + c.amount, 0);

          // Récupérer les transactions ponctuelles FILTRÉES PAR MOIS
          const transactionsResponse = await fetch(`/api/budgets/${budget.id}/transactions?month=${month}`);
          const transactionsData = await transactionsResponse.json();
          const transactions = transactionsData.transactions || [];
          const totalTransactions = transactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);

          // Total dépensé = charges récurrentes + transactions ponctuelles
          const totalSpent = totalCharges + totalTransactions;
          const remainingBudget = budget.amount - totalSpent;

          return {
            ...budget,
            charges,
            transactions,
            totalCharges,
            totalTransactions,
            totalSpent,
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
    fetchBudgets(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

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

  // Formater le mois pour l'affichage
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

  // Vérifier si un budget est valide pour le mois sélectionné
  const isBudgetValidForMonth = (budget: Budget, month: string): boolean => {
    if (budget.period === 'MONTHLY') {
      // Budget mensuel: vérifier si start_date <= month
      if (!budget.start_date) return true; // Pas de date de début = toujours valide
      return budget.start_date <= month;
    }

    if (budget.period === 'ROLLING') {
      // Budget glissant: vérifier si start_date <= month
      if (!budget.start_date) return true;
      return budget.start_date <= month;
    }

    if (budget.period === 'MULTI') {
      // Budget multi-mois: vérifier si month est dans [period_start, period_end]
      if (!budget.period_start || !budget.period_end) return true;
      return month >= budget.period_start && month <= budget.period_end;
    }

    return true;
  };

  // Filtrer les budgets valides pour le mois sélectionné ET par recherche
  const validBudgets = budgets.filter(budget =>
    isBudgetValidForMonth(budget, selectedMonth) &&
    (budget.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculer les statistiques globales pour le mois
  const globalStats = {
    totalBudget: validBudgets.reduce((sum, b) => sum + b.amount, 0),
    totalSpent: validBudgets.reduce((sum, b) => sum + b.totalSpent, 0),
    remaining: validBudgets.reduce((sum, b) => sum + b.remainingBudget, 0),
    health: validBudgets.length > 0
      ? Math.round((validBudgets.reduce((sum, b) => sum + Math.min(b.totalSpent, b.amount), 0) / validBudgets.reduce((sum, b) => sum + b.amount, 0)) * 100)
      : 0
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Header Dashboard Premium */}
      <div className="relative bg-slate-900 pt-8 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(99,102,241,0.15),transparent)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/budgets"
                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black text-white tracking-tight">Gestion des Budgets</h1>
              </div>
              <p className="text-slate-400 font-medium">Contrôlez et optimisez vos dépenses par catégorie</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-900 hover:bg-indigo-50 transition-all active:scale-95 shadow-xl shadow-white/5"
              >
                <Plus size={18} />
                Nouveau Budget
              </button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Budget Total', value: formatCurrency(globalStats.totalBudget), icon: <Target className="text-indigo-400" />, color: 'indigo' },
              { label: 'Dépenses Réelles', value: formatCurrency(globalStats.totalSpent), icon: <TrendingDown className="text-rose-400" />, color: 'rose' },
              { label: 'Solde Restant', value: formatCurrency(globalStats.remaining), icon: <Wallet className="text-emerald-400" />, color: 'emerald', highlight: globalStats.remaining < 0 },
              { label: 'Utilisation', value: `${globalStats.health}%`, icon: <Activity className="text-blue-400" />, color: 'blue' },
            ].map((stat, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={stat.label}
                className="relative group rounded-3xl bg-white/5 p-6 border border-white/10 backdrop-blur-md overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-${stat.color}-500/10`}>
                    {stat.icon}
                  </div>
                  <div className="h-1.5 w-12 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: stat.label === 'Utilisation' ? `${globalStats.health}%` : '60%' }}
                      className={`h-full bg-${stat.color}-500/50`}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black tracking-tight ${stat.highlight ? 'text-rose-400' : 'text-white'}`}>
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-20">
        {/* Barre d'outils Modernisée */}
        <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-2 rounded-3xl shadow-xl shadow-indigo-900/5 border border-slate-200 mb-8">
          <div className="flex-1 flex items-center gap-3 px-4 w-full">
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 w-full sm:w-auto">
              <button onClick={goToPreviousMonth} className="p-1 hover:bg-white rounded-lg transition-colors text-slate-600">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-black text-slate-900 min-w-[140px] text-center capitalize">
                {formatMonthDisplay(selectedMonth)}
              </span>
              <button onClick={goToNextMonth} className="p-1 hover:bg-white rounded-lg transition-colors text-slate-600">
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              onClick={goToCurrentMonth}
              className={`p-2 rounded-2xl transition-all ${isCurrentMonth() ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:text-indigo-600'}`}
              title="Mois actuel"
            >
              <History size={18} />
            </button>

            <div className="hidden sm:flex h-8 w-[1px] bg-slate-200 mx-1" />

            <div className="hidden sm:flex flex-1 items-center gap-2 bg-slate-50 px-4 rounded-2xl border border-slate-100 focus-within:border-indigo-300 focus-within:bg-white transition-all">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer les budgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-1">
            <Link
              href="/budgets"
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
            >
              <LinkIcon size={14} />
              Vues liées
            </Link>
          </div>
        </div>

        <BudgetModal
          isOpen={showForm}
          onClose={resetForm}
          onSubmit={handleSubmit}
          editingId={editingId}
          formData={formData}
          setFormData={setFormData}
          allCategories={allCategories}
        />

        {/* Liste des budgets */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <PieChart className="text-indigo-600" size={24} />
              Budgets de la période
              <span className="text-slate-400 text-sm font-bold">({validBudgets.length})</span>
            </h2>
          </div>

          {validBudgets.length === 0 ? (
            <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="inline-flex p-4 rounded-3xl bg-slate-50 text-slate-400 mb-4">
                <PieChart size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Aucun budget trouvé</h3>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">
                {budgets.length === 0
                  ? "Commencez par créer votre premier budget pour suivre vos dépenses."
                  : `Aucun budget n'est défini pour ${formatMonthDisplay(selectedMonth)}.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {validBudgets.map((budget) => {
                const consumptionPercent = Math.min(Math.round((budget.totalSpent / budget.amount) * 100), 100);
                const isOverBudget = budget.remainingBudget < 0;

                const getCategoryIcon = (category: string) => {
                  const cat = category.toLowerCase();
                  if (cat.includes('course') || cat.includes('manger')) return <ShoppingCart size={20} />;
                  if (cat.includes('transport') || cat.includes('voiture')) return <Car size={20} />;
                  if (cat.includes('santé') || cat.includes('docteur')) return <Heart size={20} />;
                  if (cat.includes('logement') || cat.includes('loyer')) return <Home size={20} />;
                  if (cat.includes('énergie') || cat.includes('élec')) return <Zap size={20} />;
                  if (cat.includes('télécom') || cat.includes('phone')) return <Phone size={20} />;
                  if (cat.includes('loisir') || cat.includes('game')) return <Gamepad2 size={20} />;
                  if (cat.includes('assurance')) return <ShieldCheck size={20} />;
                  return <PieChart size={20} />;
                };

                return (
                  <motion.div
                    layout
                    key={budget.id}
                    className="group relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${isOverBudget ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'} transition-colors`}>
                          {getCategoryIcon(budget.category)}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">{budget.category}</h3>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {formatPeriodLabel(budget)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <button
                          onClick={() => handleEdit(budget)}
                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consommé</p>
                          <p className="text-2xl font-black text-slate-900">{formatCurrency(budget.totalSpent)}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Limite</p>
                          <p className="text-lg font-bold text-slate-500">{formatCurrency(budget.amount)}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${consumptionPercent}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full rounded-full ${isOverBudget ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                            }`}
                        />
                        {consumptionPercent > 0 && consumptionPercent < 100 && (
                          <div className="absolute top-0 right-0 h-full w-[2px] bg-white/20" style={{ left: `${consumptionPercent}%` }} />
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className={isOverBudget ? 'text-rose-500' : 'text-slate-400'}>
                          {consumptionPercent}% Utilisé
                        </span>
                        <span className={isOverBudget ? 'text-rose-600' : 'text-emerald-600'}>
                          {isOverBudget ? 'Dépassement de ' : 'Reste '} {formatCurrency(Math.abs(budget.remainingBudget))}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-6 mt-6 border-t border-slate-100">
                      <div className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between group/fixed">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white text-orange-500 shadow-sm transition-colors group-hover/fixed:bg-orange-500 group-hover/fixed:text-white">
                            <Zap size={14} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fixes</p>
                            <p className="text-xs font-bold text-slate-700">{formatCurrency(budget.totalCharges)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedCharges);
                            if (newExpanded.has(`${budget.id}-charges`)) newExpanded.delete(`${budget.id}-charges`);
                            else newExpanded.add(`${budget.id}-charges`);
                            setExpandedCharges(newExpanded);
                          }}
                          className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-indigo-600 transition-all"
                        >
                          <ChevronDown size={14} className={`transition-transform duration-300 ${expandedCharges.has(`${budget.id}-charges`) ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between group/spot">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white text-purple-500 shadow-sm transition-colors group-hover/spot:bg-purple-500 group-hover/spot:text-white">
                            <ShoppingCart size={14} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ponctuelles</p>
                            <p className="text-xs font-bold text-slate-700">{formatCurrency(budget.totalTransactions)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedCharges);
                            if (newExpanded.has(`${budget.id}-tx`)) newExpanded.delete(`${budget.id}-tx`);
                            else newExpanded.add(`${budget.id}-tx`);
                            setExpandedCharges(newExpanded);
                          }}
                          className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-indigo-600 transition-all"
                        >
                          <ChevronDown size={14} className={`transition-transform duration-300 ${expandedCharges.has(`${budget.id}-tx`) ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Fixed Expenses */}
                    <AnimatePresence mode="wait">
                      {expandedCharges.has(`${budget.id}-charges`) && budget.charges.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-2"
                        >
                          <div className="p-3 rounded-2xl bg-orange-50/50 border border-orange-100 flex flex-col gap-2">
                            {budget.charges.map(charge => (
                              <div key={charge.id} className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                                <span className="flex items-center gap-2 truncate pr-2">
                                  <div className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" />
                                  <span className="truncate">{charge.label}</span>
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span>{formatCurrency(charge.amount)}</span>
                                  <button onClick={() => handleRemoveCharge(budget.id, charge.id)} className="text-rose-400 hover:text-rose-600">
                                    <X size={10} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Collapsible Transactions */}
                    <AnimatePresence mode="wait">
                      {expandedCharges.has(`${budget.id}-tx`) && budget.transactions.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-2"
                        >
                          <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col gap-2">
                            {budget.transactions.map(tx => (
                              <div key={tx.id} className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                                <span className="flex items-center gap-2 truncate pr-2">
                                  <div className="w-1 h-1 rounded-full bg-purple-400 flex-shrink-0" />
                                  <span className="truncate">{tx.label}</span>
                                </span>
                                <span className="flex-shrink-0">{formatCurrency(tx.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => openAssignChargesModal(budget.id)}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      Gérer les charges liées
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal d'affectation Modernisée */}
      <AnimatePresence>
        {showAssignModal && selectedBudget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                      <LinkIcon size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Affecter des charges
                      </h2>
                      <p className="text-slate-400 text-sm font-medium">
                        Lier des charges récurrentes au budget <span className="text-indigo-600 font-bold">{selectedBudget.category}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm font-bold text-emerald-700 flex items-center gap-2"
                  >
                    <ShieldCheck size={18} />
                    {successMessage}
                  </motion.div>
                )}
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                {availableCharges.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 rounded-3xl bg-slate-50 text-slate-300 mb-4">
                      <ShieldCheck size={40} />
                    </div>
                    <p className="text-slate-500 font-bold">Toutes les charges sont affectées.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">
                      {availableCharges.length} charge{availableCharges.length > 1 ? 's' : ''} disponible{availableCharges.length > 1 ? 's' : ''}
                    </p>
                    {availableCharges.map((charge) => (
                      <motion.div
                        layout
                        key={charge.id}
                        className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-900/5 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-xl bg-white shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <Zap size={18} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 leading-tight">{charge.label}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{charge.account}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-slate-900">{formatCurrency(charge.amount)}</span>
                          <button
                            onClick={() => handleAssignCharge(charge.id)}
                            disabled={assigning}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-600 disabled:opacity-50 transition-all active:scale-95"
                          >
                            Affecter
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedBudgetId(null);
                  }}
                  className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
