import React from 'react';
import { BudgetsClient } from './BudgetsClient';
import { PieChart } from 'lucide-react';

// Cache cette page pendant 60 secondes
export const revalidate = 60;

export default function BudgetsPage() {
  return (
    <main className="page-shell min-h-screen bg-slate-50/50 pb-20">
      {/* Premium Header */}
      <section className="relative overflow-hidden bg-slate-900 px-6 py-12 sm:px-10 sm:py-20 shadow-2xl rounded-b-[40px] mb-12">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-xl border border-white/10 shadow-2xl">
              <PieChart className="h-10 w-10 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3">
                Mes Budgets
              </h1>
              <p className="text-slate-400 text-lg font-medium max-w-lg leading-relaxed">
                Suivez la répartition de vos dépenses et surveillez vos plafonds en temps réel.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Background Decorations */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-purple-500/10 blur-[100px]" />
      </section>

      <div className="mx-auto max-w-5xl px-4">
        <BudgetsClient />
      </div>
    </main>
  );
}