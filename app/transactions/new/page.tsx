import React from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export default function NewTransactionPage() {
  return (
    <main className="page-shell">
      <section className="overview-card">
        <p className="eyebrow">Transactions</p>
        <h1>Nouvelle transaction</h1>
        <p>Ajoutez une transaction pour commencer votre suivi financier.</p>
      </section>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <TransactionForm />
        </div>
      </div>
    </main>
  );
}

