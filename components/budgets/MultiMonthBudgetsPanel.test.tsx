import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MultiMonthBudgetsPanel } from './MultiMonthBudgetsPanel';
import { mockedEnginePayload } from '@/lib/api';

describe('MultiMonthBudgetsPanel', () => {
  it('renders heading and all multi-month budget cards', () => {
    const budgets = mockedEnginePayload.multiMonthBudgets;
    render(<MultiMonthBudgetsPanel budgets={budgets} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Budgets multi-mois' })).toBeInTheDocument();

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(budgets.length);

    for (const budget of budgets) {
      expect(screen.getByRole('heading', { level: 3, name: budget.category })).toBeInTheDocument();
    }

    const startCounts = budgets.reduce<Record<string, number>>((acc, budget) => {
      acc[budget.periodStart] = (acc[budget.periodStart] ?? 0) + 1;
      return acc;
    }, {});
    const endCounts = budgets.reduce<Record<string, number>>((acc, budget) => {
      acc[budget.periodEnd] = (acc[budget.periodEnd] ?? 0) + 1;
      return acc;
    }, {});

    for (const [periodStart, count] of Object.entries(startCounts)) {
      expect(screen.getAllByText(periodStart)).toHaveLength(count);
    }
    for (const [periodEnd, count] of Object.entries(endCounts)) {
      expect(screen.getAllByText(periodEnd)).toHaveLength(count);
    }

    // Status labels are user-facing (not raw status enums)
    expect(screen.getByText('Maîtrisé')).toBeInTheDocument();
  });

  it('does not mutate the provided budgets array', () => {
    const copy = JSON.parse(JSON.stringify(mockedEnginePayload.multiMonthBudgets));

    render(<MultiMonthBudgetsPanel budgets={mockedEnginePayload.multiMonthBudgets} />);

    expect(mockedEnginePayload.multiMonthBudgets).toEqual(copy);
  });
});
