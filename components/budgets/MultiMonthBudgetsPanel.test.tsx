import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MultiMonthBudgetsPanel } from './MultiMonthBudgetsPanel';
import { mockedEnginePayload } from '@/lib/api';

describe('MultiMonthBudgetsPanel', () => {
  it('renders multi-month budgets in contract order and matches snapshot', () => {
    const { container } = render(<MultiMonthBudgetsPanel budgets={mockedEnginePayload.multiMonthBudgets} />);

    expect(container).toMatchSnapshot();

    const categories = screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent);

    expect(categories).toEqual(mockedEnginePayload.multiMonthBudgets.map((budget) => budget.category));
  });

  it('does not mutate the provided budgets array', () => {
    const copy = JSON.parse(JSON.stringify(mockedEnginePayload.multiMonthBudgets));

    render(<MultiMonthBudgetsPanel budgets={mockedEnginePayload.multiMonthBudgets} />);

    expect(mockedEnginePayload.multiMonthBudgets).toEqual(copy);
  });
});
