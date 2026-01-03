'use client';

import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/format';
import type { MonthProjection } from '@/lib/types';

interface KPIGridProps {
    currentMonth: MonthProjection;
}

export function KPIGrid({ currentMonth }: KPIGridProps) {
    const variation = currentMonth.endingBalance - currentMonth.openingBalance;

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
            <motion.div variants={item} className="bg-white rounded-lg border-2 border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Solde Début
                </p>
                <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(currentMonth.openingBalance)}
                </p>
            </motion.div>

            {/* Revenus */}
            <motion.div variants={item} className="bg-green-50 rounded-lg border-2 border-green-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-2">
                    Revenus
                </p>
                <p className="text-3xl font-bold text-green-600">
                    +{formatCurrency(currentMonth.income)}
                </p>
            </motion.div>

            {/* Dépenses */}
            <motion.div variants={item} className="bg-red-50 rounded-lg border-2 border-red-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-700 mb-2">
                    Dépenses
                </p>
                <p className="text-3xl font-bold text-red-600">
                    -{formatCurrency(currentMonth.expenses)}
                </p>
            </motion.div>

            {/* Solde Final */}
            <motion.div variants={item} className={`rounded-lg border-2 p-6 shadow-sm hover:shadow-md transition-shadow ${variation >= 0
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-orange-50 border-orange-200'
                }`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Solde Final
                </p>
                <p className={`text-3xl font-bold ${variation >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                    {formatCurrency(currentMonth.endingBalance)}
                </p>
                <p className={`text-sm mt-1 ${variation >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                    {variation >= 0 ? '+' : ''}{formatCurrency(variation)} ce mois
                </p>
            </motion.div>
        </motion.div>
    );
}
