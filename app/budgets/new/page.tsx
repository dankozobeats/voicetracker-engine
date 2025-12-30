import React from 'react';
import { BudgetForm } from '@/components/budgets/BudgetForm';

export default function NewBudgetPage() {
  return (
    <main className="page-shell">
      <section className="overview-card">
        <p className="eyebrow">Budgets</p>
        <h1>Nouveau budget</h1>
        <p>Créez un budget pour suivre vos dépenses par catégorie.</p>
      </section>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <BudgetForm />
        </div>
      </div>
    </main>
  );
}


