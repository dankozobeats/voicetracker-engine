import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CategoryBudgetsPanel } from './CategoryBudgetsPanel';
import { mockedEnginePayload } from '@/lib/api';

describe('CategoryBudgetsPanel', () => {
  it('renders heading, counters, and all budget cards', () => {
    const budgets = mockedEnginePayload.categoryBudgets;
    const ok = budgets.filter((b) => b.status === 'OK').length;
    const warning = budgets.filter((b) => b.status === 'WARNING').length;
    const exceeded = budgets.filter((b) => b.status === 'EXCEEDED').length;

    render(<CategoryBudgetsPanel budgets={budgets} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Budgets mensuels' })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${budgets.length} budget`, 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`\\b${ok}\\s+OK\\b`, 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`\\b${warning}\\s+Attention\\b`, 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`\\b${exceeded}\\s+Dépassé`, 'i'))).toBeInTheDocument();

    expect(screen.getByRole('button', { name: `Tout (${budgets.length})` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `OK (${ok})` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Attention (${warning})` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Dépassés (${exceeded})` })).toBeInTheDocument();

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(budgets.length);

    for (const budget of budgets) {
      expect(screen.getByRole('heading', { level: 3, name: budget.category })).toBeInTheDocument();
    }
  });

  it('does not mutate the provided budgets array', () => {
    const budgetsCopy = JSON.parse(JSON.stringify(mockedEnginePayload.categoryBudgets));

    render(<CategoryBudgetsPanel budgets={mockedEnginePayload.categoryBudgets} />);

    expect(mockedEnginePayload.categoryBudgets).toEqual(budgetsCopy);
  });
});
