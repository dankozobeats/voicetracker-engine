'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, TrendingUp, Calendar, Info, Layers } from 'lucide-react';

type BudgetPeriod = 'MONTHLY' | 'ROLLING' | 'MULTI';

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

interface BudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editingId: string | null;
    formData: BudgetFormData;
    setFormData: React.Dispatch<React.SetStateAction<BudgetFormData>>;
    allCategories: string[];
}

export function BudgetModal({
    isOpen,
    onClose,
    onSubmit,
    editingId,
    formData,
    setFormData,
    allCategories,
}: BudgetModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-white/20"
                    >
                        {/* Header */}
                        <div className="relative h-32 bg-slate-900 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20" />
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <TrendingUp size={120} />
                            </div>

                            <div className="relative h-full flex items-center justify-between px-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">
                                        {editingId ? 'Modifier le budget' : 'Nouveau budget'}
                                    </h2>
                                    <p className="text-slate-400 text-sm font-medium mt-1">
                                        Configurez vos limites de dépenses mensuelles
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={onSubmit} className="p-8 space-y-6">
                            {/* Catégorie */}
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">
                                    <Layers size={12} className="text-indigo-500" />
                                    Catégorie
                                </label>
                                <div className="space-y-3">
                                    <select
                                        value={allCategories.includes(formData.category) ? formData.category : '__custom__'}
                                        onChange={(e) => {
                                            if (e.target.value !== '__custom__') {
                                                setFormData({ ...formData, category: e.target.value });
                                            } else {
                                                setFormData({ ...formData, category: '' });
                                            }
                                        }}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none"
                                    >
                                        <option value="">Sélectionner une catégorie...</option>
                                        {allCategories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value="__custom__">➕ Autre (personnalisée)</option>
                                    </select>

                                    {(!allCategories.includes(formData.category) || formData.category === '') && (
                                        <motion.input
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            type="text"
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="Nom de la nouvelle catégorie..."
                                            className="w-full rounded-2xl border border-indigo-100 bg-indigo-50/30 px-4 py-3 text-sm font-bold text-indigo-900 placeholder:text-indigo-300 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Montant */}
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">
                                    <TrendingUp size={12} className="text-emerald-500" />
                                    Montant limite
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">€</span>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.amount || ''}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-4 text-2xl font-black text-slate-900 placeholder:text-slate-200 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Période */}
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">
                                        <Calendar size={12} className="text-amber-500" />
                                        Période
                                    </label>
                                    <select
                                        value={formData.period}
                                        onChange={(e) => setFormData({ ...formData, period: e.target.value as BudgetPeriod })}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none"
                                    >
                                        <option value="MONTHLY">Mensuel</option>
                                        <option value="ROLLING">Glissant</option>
                                        <option value="MULTI">Période fixe</option>
                                    </select>
                                </div>

                                {/* Options de période */}
                                <div className="col-span-2 sm:col-span-1">
                                    {formData.period === 'ROLLING' && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">
                                                <Info size={12} className="text-blue-500" />
                                                Mois glissants
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={formData.window_months}
                                                onChange={(e) => setFormData({ ...formData, window_months: parseInt(e.target.value) || 3 })}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                {formData.period === 'MULTI' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="col-span-2 grid grid-cols-2 gap-4 pt-2"
                                    >
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Début</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.period_start}
                                                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Fin</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.period_end}
                                                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
                                >
                                    <Save size={18} />
                                    {editingId ? 'Mettre à jour' : 'Créer le budget'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
