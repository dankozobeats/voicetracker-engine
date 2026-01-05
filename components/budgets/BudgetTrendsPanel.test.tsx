import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { BudgetTrendsPanel } from './BudgetTrendsPanel';
import { mockedEnginePayload } from '@/lib/api';

describe('BudgetTrendsPanel', () => {
  it('renders heading and all trend cards', () => {
    const trends = mockedEnginePayload.trends;
    render(<BudgetTrendsPanel trends={trends} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Évolution des dépenses' })).toBeInTheDocument();

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(trends.length);

    for (const trend of trends) {
      expect(screen.getByRole('heading', { level: 3, name: trend.category })).toBeInTheDocument();
    }

    // User-facing labels for trend status
    expect(screen.getByText('En hausse')).toBeInTheDocument();
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  it('keeps the trends array intact', () => {
    const copy = JSON.parse(JSON.stringify(mockedEnginePayload.trends));

    render(<BudgetTrendsPanel trends={mockedEnginePayload.trends} />);

    expect(mockedEnginePayload.trends).toEqual(copy);
  });
});
