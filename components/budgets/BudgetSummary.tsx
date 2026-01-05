'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, CreditCard, PiggyBank, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { CategoryBudgetResult } from '@/lib/types';

interface BudgetSummaryProps {
    budgets: CategoryBudgetResult[];
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({ budgets }) => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const consumptionRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const data = [
        { name: 'Consommé', value: totalSpent, color: '#6366f1' }, // indigo-500
        { name: 'Restant', value: Math.max(0, totalRemaining), color: '#e2e8f0' }, // slate-200
    ];

    const stats = [
        {
            label: 'Budget Global',
            value: formatCurrency(totalBudget),
            icon: Wallet,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
        },
        {
            label: 'Dépenses Totales',
            value: formatCurrency(totalSpent),
            icon: CreditCard,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
        },
        {
            label: 'Reste à dépenser',
            value: formatCurrency(totalRemaining),
            icon: PiggyBank,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            label: 'Taux de Consommation',
            value: `${Math.round(consumptionRate)}%`,
            icon: Activity,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-5"
                    >
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                {stat.label}
                            </p>
                            <p className={`text-2xl font-black tracking-tight ${stat.color}`}>
                                {stat.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Global Chart Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-[40px] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]"
            >
                <div className="relative z-10 w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Centered Percentage */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-white leading-none">
                            {Math.round(consumptionRate)}%
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">
                            Utilisé
                        </span>
                    </div>
                </div>

                <p className="relative z-10 text-center text-xs font-bold text-slate-400 mt-4 max-w-[180px]">
                    {totalSpent > totalBudget
                        ? "Attention : Vous avez dépassé votre budget global."
                        : "Votre santé financière globale est excellente."}
                </p>

                {/* Background Gradients */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-[80px]" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-rose-500/10 blur-[80px]" />
            </motion.div>
        </div>
    );
};
