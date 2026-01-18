import React from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTransactionPage() {
  return (
    <main className="page-shell min-h-screen bg-slate-50/50 pb-20">
      {/* Header Strategy */}
      <section className="relative overflow-hidden bg-slate-900 px-6 py-12 sm:px-10 sm:py-20 shadow-2xl rounded-b-[40px] mb-12">
        <div className="relative z-10 mx-auto max-w-4xl">
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'analyse
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CreditCard className="h-10 w-10 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3">
                Nouvelle Flux
              </h1>
              <p className="text-slate-400 text-lg font-medium max-w-lg leading-relaxed">
                Enregistrez vos revenus et vos dépenses pour un suivi financier en temps réel.
              </p>
            </div>
          </div>
        </div>

        {/* Decorations */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-teal-500/10 blur-[100px]" />
      </section>

      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 sm:p-12 shadow-xl shadow-slate-200/50">
          <TransactionForm />
        </div>
      </div>
    </main>
  );
}
