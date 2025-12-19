import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { BudgetTrendsPanel } from './BudgetTrendsPanel';
import { mockedEnginePayload } from '@/lib/api';

describe('BudgetTrendsPanel', () => {
  it('renders trends in provided order and matches snapshot', () => {
    const { container } = render(<BudgetTrendsPanel trends={mockedEnginePayload.trends} />);

    expect(container).toMatchSnapshot();

    const statuses = screen.getAllByText(/INCREASING|STABLE/);

    expect(statuses.map((node) => node.textContent)).toEqual(
      mockedEnginePayload.trends.map((trend) => trend.trend)
    );
  });

  it('keeps the trends array intact', () => {
    const copy = JSON.parse(JSON.stringify(mockedEnginePayload.trends));

    render(<BudgetTrendsPanel trends={mockedEnginePayload.trends} />);

    expect(mockedEnginePayload.trends).toEqual(copy);
  });
});
