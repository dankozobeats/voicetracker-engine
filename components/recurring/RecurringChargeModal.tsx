'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Reminder {
    id: string;
    month: string;
    note: string;
    dismissed: boolean;
}

interface FormData {
    label: string;
    amount: number;
    account: 'SG' | 'FLOA';
    type: 'INCOME' | 'EXPENSE';
    purpose: 'REGULAR' | 'SAVINGS' | 'EMERGENCY' | 'HEALTH' | 'DEBT';
    start_date: string;
    end_date: string;
    excluded_months: string[];
    new_excluded_month: string;
    monthly_overrides: Record<string, number>;
    override_month: string;
    override_amount: string;
    reminders: Reminder[];
    reminder_month: string;
    reminder_note: string;
    initial_balance: string;
    remaining_balance: string;
    interest_rate: string;
    debt_start_date: string;
}

interface RecurringChargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingId: string | null;
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    submitting: boolean;
    // State for Pickers/Sections in Form
    showStartDatePicker: boolean;
    setShowStartDatePicker: (show: boolean) => void;
    showEndDatePicker: boolean;
    setShowEndDatePicker: (show: boolean) => void;
    showExcludedMonthsPicker: boolean;
    setShowExcludedMonthsPicker: (show: boolean) => void;
    showMonthlyOverridesSection: boolean;
    setShowMonthlyOverridesSection: (show: boolean) => void;
    showRemindersSection: boolean;
    setShowRemindersSection: (show: boolean) => void;
    // Year controls
    startDateYear: number;
    setStartDateYear: (year: number) => void;
    endDateYear: number;
    setEndDateYear: (year: number) => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    overrideYear: number;
    setOverrideYear: (year: number) => void;
    reminderYear: number;
    setReminderYear: (year: number) => void;
    // Handlers
    handleStartDateClick: (month: number) => void;
    handleEndDateClick: (month: number) => void;
    clearEndDate: () => void;
    handleMonthClick: (month: number) => void;
    removeExcludedMonth: (month: string) => void;
    handleOverrideMonthClick: (month: number) => void;
    addMonthlyOverride: () => void;
    removeMonthlyOverride: (month: string) => void;
    handleReminderMonthClick: (month: number) => void;
    addReminder: () => void;
    removeReminder: (id: string) => void;
    formatCurrency: (amount: number) => string;
}

export const RecurringChargeModal = ({
    isOpen,
    onClose,
    editingId,
    formData,
    setFormData,
    onSubmit,
    submitting,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    showExcludedMonthsPicker,
    setShowExcludedMonthsPicker,
    showMonthlyOverridesSection,
    setShowMonthlyOverridesSection,
    showRemindersSection,
    setShowRemindersSection,
    startDateYear,
    setStartDateYear,
    endDateYear,
    setEndDateYear,
    selectedYear,
    setSelectedYear,
    overrideYear,
    setOverrideYear,
    reminderYear,
    setReminderYear,
    handleStartDateClick,
    handleEndDateClick,
    clearEndDate,
    handleMonthClick,
    removeExcludedMonth,
    handleOverrideMonthClick,
    addMonthlyOverride,
    removeMonthlyOverride,
    handleReminderMonthClick,
    addReminder,
    removeReminder,
    formatCurrency,
}: RecurringChargeModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingId ? 'Modifier la charge récurrente' : 'Nouvelle charge récurrente'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-1 sm:col-span-2">
                                    <label htmlFor="label" className="block text-sm font-medium text-slate-700">
                                        Libellé <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="label"
                                        required
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500/10 transition-all"
                                        placeholder="Ex: Salaire, Loyer, Netflix..."
                                    />
                                </div>

                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-slate-700">
                                        Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="type"
                                        required
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                                        className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500/10 transition-all bg-white"
                                    >
                                        <option value="EXPENSE">Dépense (Loyer, abonnements...)</option>
                                        <option value="INCOME">Revenu (Salaire, revenus...)</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="purpose" className="block text-sm font-medium text-slate-700">
                                        Usage <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="purpose"
                                        required
                                        value={formData.purpose}
                                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value as 'REGULAR' | 'SAVINGS' | 'EMERGENCY' | 'HEALTH' | 'DEBT' })}
                                        className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500/10 transition-all bg-white"
                                    >
                                        <option value="REGULAR">💼 Charge normale (loyer, Netflix, téléphone...)</option>
                                        <option value="SAVINGS">💰 Épargne (Revolut, livret A...)</option>
                                        <option value="EMERGENCY">⚠️ Provision pour imprévus</option>
                                        <option value="HEALTH">🏥 Provision santé/médecin</option>
                                        <option value="DEBT">💳 Dette / Crédit à rembourser</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
                                        {formData.purpose === 'DEBT' ? 'Mensualité' : 'Montant'} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">€</span>
                                        <input
                                            type="number"
                                            id="amount"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formData.amount === 0 ? '' : formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className="block w-full rounded-lg border border-slate-300 pl-8 pr-4 py-2.5 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500/10 transition-all"
                                            placeholder={formData.purpose === 'DEBT' ? 'ex: 250' : '0.00'}
                                        />
                                    </div>
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
                                        className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500/10 transition-all bg-white"
                                    >
                                        <option value="SG">SG (Principal)</option>
                                        <option value="FLOA">FLOA (Crédit)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Champs spécifiques aux dettes */}
                            {formData.purpose === 'DEBT' && (
                                <div className="border-2 border-red-100 bg-red-50/30 rounded-xl p-5 space-y-4">
                                    <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
                                        <span>💳</span> Informations sur la dette
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="initial_balance" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                                Capital initial
                                            </label>
                                            <input
                                                type="number"
                                                id="initial_balance"
                                                min="0"
                                                step="0.01"
                                                value={formData.initial_balance}
                                                onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all"
                                                placeholder="ex: 5000"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="remaining_balance" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                                Capital restant <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                id="remaining_balance"
                                                required={formData.purpose === 'DEBT'}
                                                min="0"
                                                step="0.01"
                                                value={formData.remaining_balance}
                                                onChange={(e) => setFormData({ ...formData, remaining_balance: e.target.value })}
                                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all"
                                                placeholder="ex: 4200"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="interest_rate" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                                Taux d'intérêt (%)
                                            </label>
                                            <input
                                                type="number"
                                                id="interest_rate"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={formData.interest_rate}
                                                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all"
                                                placeholder="ex: 5.5"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="debt_start_date" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                                Date de début
                                            </label>
                                            <input
                                                type="date"
                                                id="debt_start_date"
                                                value={formData.debt_start_date}
                                                onChange={(e) => setFormData({ ...formData, debt_start_date: e.target.value })}
                                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Période et suspensions */}
                            <div className="border-t border-slate-100 pt-6 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Période et suspensions</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Date de début */}
                                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                                            className="w-full flex items-center justify-between group"
                                        >
                                            <span className="text-sm font-semibold text-slate-700">Début <span className="text-red-500">*</span></span>
                                            <div className="flex items-center gap-2">
                                                {formData.start_date && (
                                                    <span className="text-sm font-medium text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                                        {new Date(formData.start_date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                                    </span>
                                                )}
                                                <svg
                                                    className={`h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-transform ${showStartDatePicker ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>

                                        {showStartDatePicker && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                                                <div className="flex items-center justify-center gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setStartDateYear(startDateYear - 1)}
                                                        className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>
                                                    <span className="text-sm font-bold text-slate-900">{startDateYear}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStartDateYear(startDateYear + 1)}
                                                        className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((name, i) => {
                                                        const val = `${startDateYear}-${String(i + 1).padStart(2, '0')}`;
                                                        const active = formData.start_date === val;
                                                        return (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => handleStartDateClick(i)}
                                                                className={`rounded-lg py-1.5 text-xs font-bold transition-all ${active
                                                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                                                                    }`}
                                                            >
                                                                {name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Date de fin */}
                                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                        <div
                                            onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                                            className="w-full flex items-center justify-between group cursor-pointer"
                                        >
                                            <span className="text-sm font-semibold text-slate-700">Fin (optionnel)</span>
                                            <div className="flex items-center gap-2">
                                                {formData.end_date ? (
                                                    <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                                        <span className="text-sm font-medium text-slate-900">
                                                            {new Date(formData.end_date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); clearEndDate(); }}
                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Indéfinie</span>
                                                )}
                                                <svg
                                                    className={`h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-transform ${showEndDatePicker ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {showEndDatePicker && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                                                <div className="flex items-center justify-center gap-4">
                                                    <button type="button" onClick={() => setEndDateYear(endDateYear - 1)} className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                    </button>
                                                    <span className="text-sm font-bold text-slate-900">{endDateYear}</span>
                                                    <button type="button" onClick={() => setEndDateYear(endDateYear + 1)} className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((name, i) => {
                                                        const val = `${endDateYear}-${String(i + 1).padStart(2, '0')}`;
                                                        const active = formData.end_date === val;
                                                        return (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => handleEndDateClick(i)}
                                                                className={`rounded-lg py-1.5 text-xs font-bold transition-all ${active ? 'bg-green-600 text-white shadow-lg shadow-green-600/20 border-green-600' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                                                                    }`}
                                                            >
                                                                {name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mois suspendus */}
                                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowExcludedMonthsPicker(!showExcludedMonthsPicker)}
                                        className="w-full flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-amber-900">Mois suspendus</span>
                                            {formData.excluded_months.length > 0 && (
                                                <span className="flex items-center justify-center bg-amber-200 text-amber-900 text-[10px] font-bold h-5 min-w-5 px-1 rounded-full">
                                                    {formData.excluded_months.length}
                                                </span>
                                            )}
                                        </div>
                                        <svg
                                            className={`h-4 w-4 text-amber-400 group-hover:text-amber-600 transition-transform ${showExcludedMonthsPicker ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {formData.excluded_months.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {formData.excluded_months.map((month) => (
                                                <span key={month} className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-amber-200 pl-2.5 pr-1.5 py-1 text-xs font-bold text-amber-900 shadow-sm">
                                                    {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                                                    <button type="button" onClick={() => removeExcludedMonth(month)} className="text-amber-400 hover:text-red-500 transition-colors p-0.5">
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {showExcludedMonthsPicker && (
                                        <div className="mt-4 pt-4 border-t border-amber-200 space-y-4">
                                            <div className="flex items-center justify-center gap-4">
                                                <button type="button" onClick={() => setSelectedYear(selectedYear - 1)} className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-amber-200 transition-all">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                </button>
                                                <span className="text-sm font-bold text-slate-900">{selectedYear}</span>
                                                <button type="button" onClick={() => setSelectedYear(selectedYear + 1)} className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-amber-200 transition-all">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((name, i) => {
                                                    const val = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
                                                    const active = formData.excluded_months.includes(val);
                                                    return (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => handleMonthClick(i)}
                                                            className={`rounded-lg py-1.5 text-xs font-bold transition-all ${active ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 border-amber-500' : 'bg-white border border-amber-200 text-amber-700 hover:border-amber-300'
                                                                }`}
                                                        >
                                                            {name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Montants variables */}
                                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowMonthlyOverridesSection(!showMonthlyOverridesSection)}
                                        className="w-full flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-emerald-900">Montants variables</span>
                                            {Object.keys(formData.monthly_overrides).length > 0 && (
                                                <span className="flex items-center justify-center bg-emerald-200 text-emerald-900 text-[10px] font-bold h-5 min-w-5 px-1 rounded-full">
                                                    {Object.keys(formData.monthly_overrides).length}
                                                </span>
                                            )}
                                        </div>
                                        <svg className={`h-4 w-4 text-emerald-400 group-hover:text-emerald-600 transition-transform ${showMonthlyOverridesSection ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showMonthlyOverridesSection && (
                                        <div className="mt-4 pt-4 border-t border-emerald-200 space-y-4">
                                            <div className="flex items-center justify-center gap-4">
                                                <button type="button" onClick={() => setOverrideYear(overrideYear - 1)} className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-emerald-200 transition-all">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                </button>
                                                <span className="text-sm font-bold text-slate-900">{overrideYear}</span>
                                                <button type="button" onClick={() => setOverrideYear(overrideYear + 1)} className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-emerald-200 transition-all">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((name, i) => {
                                                    const val = `${overrideYear}-${String(i + 1).padStart(2, '0')}`;
                                                    const active = formData.override_month === val;
                                                    return (
                                                        <button key={i} type="button" onClick={() => handleOverrideMonthClick(i)} className={`rounded-lg py-1.5 text-xs font-bold transition-all ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white border border-emerald-200 text-emerald-700 hover:border-emerald-300'}`}>
                                                            {name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={formData.override_amount}
                                                        onChange={(e) => setFormData({ ...formData, override_amount: e.target.value })}
                                                        className="w-full rounded-lg border border-emerald-200 bg-white pl-7 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                                                        placeholder="Montant"
                                                    />
                                                </div>
                                                <button type="button" onClick={addMonthlyOverride} disabled={!formData.override_month || !formData.override_amount} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all">
                                                    Ajouter
                                                </button>
                                            </div>
                                            {Object.keys(formData.monthly_overrides).length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {Object.entries(formData.monthly_overrides).sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => (
                                                        <span key={month} className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-emerald-200 pl-2.5 pr-1.5 py-1 text-xs font-bold text-emerald-900 shadow-sm">
                                                            {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}: {formatCurrency(amount)}
                                                            <button type="button" onClick={() => removeMonthlyOverride(month)} className="text-emerald-400 hover:text-red-500 transition-colors p-0.5"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Rappels */}
                                <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100">
                                    <button type="button" onClick={() => setShowRemindersSection(!showRemindersSection)} className="w-full flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-orange-900">Rappels & Mémos</span>
                                            {formData.reminders.length > 0 && (
                                                <span className="flex items-center justify-center bg-orange-200 text-orange-900 text-[10px] font-bold h-5 min-w-5 px-1 rounded-full">{formData.reminders.length}</span>
                                            )}
                                        </div>
                                        <svg className={`h-4 w-4 text-orange-400 group-hover:text-orange-600 transition-transform ${showRemindersSection ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>

                                    {showRemindersSection && (
                                        <div className="mt-4 pt-4 border-t border-orange-200 space-y-4">
                                            <div className="flex items-center justify-center gap-4">
                                                <button type="button" onClick={() => setReminderYear(reminderYear - 1)} className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-orange-200 transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                                                <span className="text-sm font-bold text-slate-900">{reminderYear}</span>
                                                <button type="button" onClick={() => setReminderYear(reminderYear + 1)} className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-orange-200 transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((name, i) => {
                                                    const val = `${reminderYear}-${String(i + 1).padStart(2, '0')}`;
                                                    const active = formData.reminder_month === val;
                                                    return (
                                                        <button key={i} type="button" onClick={() => handleReminderMonthClick(i)} className={`rounded-lg py-1.5 text-xs font-bold transition-all ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-white border border-orange-200 text-orange-700 hover:border-orange-300'}`}>
                                                            {name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={formData.reminder_note}
                                                    onChange={(e) => setFormData({ ...formData, reminder_note: e.target.value })}
                                                    className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                                                    placeholder="Note / Mémo (ex: Fin d'engagement)"
                                                    maxLength={100}
                                                />
                                                <button type="button" onClick={addReminder} disabled={!formData.reminder_month || !formData.reminder_note.trim()} className="w-full rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition-all">
                                                    Ajouter le rappel
                                                </button>
                                            </div>
                                            {formData.reminders.length > 0 && (
                                                <div className="space-y-2 pt-2">
                                                    {formData.reminders.sort((a, b) => a.month.localeCompare(b.month)).map((reminder) => (
                                                        <div key={reminder.id} className="flex items-start gap-3 rounded-lg bg-white border border-orange-200 p-3 shadow-sm group">
                                                            <div className="flex-1">
                                                                <div className="text-xs font-bold text-orange-900 mb-0.5">{new Date(reminder.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                                                                <div className="text-xs text-orange-700 line-clamp-2">{reminder.note}</div>
                                                            </div>
                                                            <button type="button" onClick={() => removeReminder(reminder.id)} className="text-orange-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                                    disabled={submitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-slate-900 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                >
                                    {submitting ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
