import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MonthlySummaryPanel } from './MonthlySummaryPanel';
import { mockedMonthlySummary } from '@/lib/api';

describe('MonthlySummaryPanel', () => {
  it('renders highlights + details snapshot and preserves order', () => {
    const summaryCopy = JSON.parse(JSON.stringify(mockedMonthlySummary));

    const { container } = render(<MonthlySummaryPanel summary={mockedMonthlySummary} />);

    expect(container).toMatchSnapshot();

    const highlights = screen.getByRole('list', { name: 'Points clés' }).textContent;

    expect(highlights).toContain(mockedMonthlySummary.highlights[0]);
    expect(highlights).toContain(mockedMonthlySummary.highlights.at(-1) ?? '');

    expect(mockedMonthlySummary).toEqual(summaryCopy);
  });

  it('renders all detail sentences without mutation', () => {
    const summaryCopy = JSON.parse(JSON.stringify(mockedMonthlySummary));

    render(<MonthlySummaryPanel summary={mockedMonthlySummary} />);

    const detailList = screen.getByRole('list', { name: 'Détails' });
    expect(detailList.childElementCount).toBe(mockedMonthlySummary.details.length);

    expect(mockedMonthlySummary).toEqual(summaryCopy);
  });
});
