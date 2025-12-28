import React from 'react';
import { BudgetsClient } from './BudgetsClient';

export default function BudgetsPage() {
  return (
    <main className="page-shell">
      <section className="overview-card">
        <p className="eyebrow">Vue budgets</p>
        <h1>Budgets contractuels</h1>
        <p>Affichage des budgets tels que livrés par l&apos;engine.</p>
      </section>

      <BudgetsClient />
    </main>
  );
}