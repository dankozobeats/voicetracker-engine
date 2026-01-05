import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RollingBudgetsPanel } from './RollingBudgetsPanel';
import { mockedEnginePayload } from '@/lib/api';

describe('RollingBudgetsPanel', () => {
  it('renders heading and all rolling budget cards', () => {
    const budgets = mockedEnginePayload.rollingBudgets;
    render(<RollingBudgetsPanel budgets={budgets} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Budgets glissants' })).toBeInTheDocument();

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(budgets.length);

    for (const budget of budgets) {
      expect(screen.getByRole('heading', { level: 3, name: budget.category })).toBeInTheDocument();
    }

    const windowCounts = budgets.reduce<Record<number, number>>((acc, budget) => {
      acc[budget.windowMonths] = (acc[budget.windowMonths] ?? 0) + 1;
      return acc;
    }, {});
    for (const [windowMonths, count] of Object.entries(windowCounts)) {
      expect(screen.getAllByText(`Glissant · ${windowMonths} Mois`)).toHaveLength(count);
    }

    // Status labels are user-facing (not raw status enums)
    expect(screen.getByText('Maîtrisé')).toBeInTheDocument();
    expect(screen.getByText('Attention')).toBeInTheDocument();
  });

  it('does not mutate the budgets array', () => {
    const copy = JSON.parse(JSON.stringify(mockedEnginePayload.rollingBudgets));

    render(<RollingBudgetsPanel budgets={mockedEnginePayload.rollingBudgets} />);

    expect(mockedEnginePayload.rollingBudgets).toEqual(copy);
  });
});
