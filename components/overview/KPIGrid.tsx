'use client';

import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/format';
import type { MonthProjection } from '@/lib/types';

interface KPIGridProps {
    currentMonth: MonthProjection;
}

export function KPIGrid({ currentMonth }: KPIGridProps) {
    const variation = currentMonth.endingBalance - currentMonth.openingBalance;

    // Total des sorties = dépenses + charges fixes + différé (si négatif)
    const deferredExpense = currentMonth.deferredIn < 0 ? Math.abs(currentMonth.deferredIn) : 0;
    const totalExpenses = currentMonth.expenses + currentMonth.fixedCharges + deferredExpense;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Solde Début */}
            <motion.div variants={item} className="bg-white rounded-[24px] border-2 border-slate-100 p-4 sm:p-6 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Solde Début
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(currentMonth.openingBalance)}
                </p>
            </motion.div>

            {/* Revenus */}
            <motion.div variants={item} className="bg-emerald-50/50 rounded-[24px] border-2 border-emerald-100 p-4 sm:p-6 shadow-xl shadow-emerald-200/20 hover:shadow-2xl hover:shadow-emerald-300/30 transition-all duration-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">
                    Revenus
                </p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                    +{formatCurrency(currentMonth.income)}
                </p>
            </motion.div>

            {/* Dépenses */}
            <motion.div variants={item} className="bg-rose-50/50 rounded-[24px] border-2 border-rose-100 p-4 sm:p-6 shadow-xl shadow-rose-200/20 hover:shadow-2xl hover:shadow-rose-300/30 transition-all duration-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-2">
                    Dépenses
                </p>
                <p className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                    -{formatCurrency(totalExpenses)}
                </p>
            </motion.div>

            {/* Solde Final */}
            <motion.div variants={item} className={`rounded-[24px] border-2 p-4 sm:p-6 shadow-xl transition-all duration-300 ${variation >= 0
                ? 'bg-blue-50/50 border-blue-100 shadow-blue-200/20 hover:shadow-blue-300/30'
                : 'bg-amber-50/50 border-amber-100 shadow-amber-200/20 hover:shadow-amber-300/30'
                }`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Solde Final
                </p>
                <p className={`text-2xl sm:text-3xl font-black tracking-tight ${variation >= 0 ? 'text-blue-600' : 'text-amber-600'
                    }`}>
                    {formatCurrency(currentMonth.endingBalance)}
                </p>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${variation >= 0 ? 'text-blue-500' : 'text-amber-500'
                    }`}>
                    {variation >= 0 ? 'En hausse' : 'En baisse'} de {formatCurrency(Math.abs(variation))}
                </p>
            </motion.div>
        </motion.div>
    );
}
