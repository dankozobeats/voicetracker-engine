import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CategoryBudgetsPanel } from './CategoryBudgetsPanel';
import { mockedEnginePayload } from '@/lib/api';

describe('CategoryBudgetsPanel', () => {
  it('renders budgets in contract order, preserves statuses, and matches snapshot', () => {
    const { container } = render(<CategoryBudgetsPanel budgets={mockedEnginePayload.categoryBudgets} />);

    expect(container).toMatchSnapshot();

    const statusNodes = screen.getAllByText(/OK|WARNING|EXCEEDED/);

    expect(statusNodes.map((node) => node.textContent)).toEqual(
      mockedEnginePayload.categoryBudgets.map((budget) => budget.status)
    );
  });

  it('does not mutate the provided budgets array', () => {
    const budgetsCopy = JSON.parse(JSON.stringify(mockedEnginePayload.categoryBudgets));

    render(<CategoryBudgetsPanel budgets={mockedEnginePayload.categoryBudgets} />);

    expect(mockedEnginePayload.categoryBudgets).toEqual(budgetsCopy);
  });
});
