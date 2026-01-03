'use client';

import { formatCurrency } from '@/lib/format';
import type { MonthProjection } from '@/lib/types';
import { motion } from 'framer-motion';

interface BudgetListProps {
    categoryBudgets: MonthProjection['categoryBudgets'];
}

export function BudgetList({ categoryBudgets }: BudgetListProps) {
    if (!categoryBudgets || categoryBudgets.length === 0) {
        return (
            <div className="bg-white rounded-lg border-2 border-slate-200 p-6 text-center py-12">
                <p className="text-slate-500">Aucun budget configuré pour ce mois</p>
                <a
                    href="/budgets/manage"
                    className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Créer un budget
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
                Top 5 Budgets par Catégorie
            </h2>
            <div className="space-y-4">
                {categoryBudgets.slice(0, 5).map((budget, index) => {
                    const percentUsed = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
                    const isOverBudget = percentUsed > 100;
                    const isWarning = percentUsed > 80 && !isOverBudget;

                    return (
                        <motion.div
                            key={budget.category}
                            className="space-y-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-700">{budget.category}</span>
                                <div className="text-right">
                                    <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-slate-600'
                                        }`}>
                                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                                    </span>
                                    <span className={`ml-2 text-sm ${isOverBudget ? 'text-red-600' :
                                            isWarning ? 'text-orange-600' :
                                                'text-slate-500'
                                        }`}>
                                        ({Math.round(percentUsed)}%)
                                    </span>
                                </div>
                            </div>
                            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                                <motion.div
                                    className={`h-3 rounded-full ${isOverBudget ? 'bg-red-500' :
                                            isWarning ? 'bg-orange-500' :
                                                'bg-green-500'
                                        }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(percentUsed, 100)}%` }}
                                    transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                                />
                            </div>
                            {isOverBudget && (
                                <p className="text-sm text-red-600">
                                    ⚠️ Dépassement de {formatCurrency(budget.spent - budget.budget)}
                                </p>
                            )}
                            {isWarning && (
                                <p className="text-sm text-orange-600">
                                    ⚡ Attention, {Math.round(100 - percentUsed)}% restant
                                </p>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
