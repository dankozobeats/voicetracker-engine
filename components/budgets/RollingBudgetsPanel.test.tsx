import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RollingBudgetsPanel } from './RollingBudgetsPanel';
import { mockedEnginePayload } from '@/lib/api';

describe('RollingBudgetsPanel', () => {
  it('renders rolling budgets in provided order and matches snapshot', () => {
    const { container } = render(<RollingBudgetsPanel budgets={mockedEnginePayload.rollingBudgets} />);

    expect(container).toMatchSnapshot();

    const categories = screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent);

    expect(categories).toEqual(mockedEnginePayload.rollingBudgets.map((budget) => budget.category));
  });

  it('does not mutate the budgets array', () => {
    const copy = JSON.parse(JSON.stringify(mockedEnginePayload.rollingBudgets));

    render(<RollingBudgetsPanel budgets={mockedEnginePayload.rollingBudgets} />);

    expect(mockedEnginePayload.rollingBudgets).toEqual(copy);
  });
});
