import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { AlertPanel } from './AlertPanel';
import { mockedEnginePayload } from '@/lib/api';

describe('AlertPanel', () => {
  it('renders alerts in the provided priority order and matches snapshot', () => {
    const { container } = render(<AlertPanel alertTexts={mockedEnginePayload.alertTexts} />);

    expect(container).toMatchSnapshot();

    const alertEntries = screen.getAllByRole('article');

    expect(alertEntries).toHaveLength(mockedEnginePayload.alertTexts.length);

    const [firstEntry] = alertEntries;
    const badge = firstEntry.querySelector('.alert-badge');

    expect(firstEntry).toHaveTextContent(mockedEnginePayload.alertTexts[0].title);
    expect(badge).toHaveStyle({ backgroundColor: '#d62b2b' });
  });

  it('retains alert texts order even when severity differs', () => {
    const customAlerts = [
      { ...mockedEnginePayload.alertTexts[1], priorityRank: 1 },
      { ...mockedEnginePayload.alertTexts[0], priorityRank: 2 },
    ];

    render(<AlertPanel alertTexts={customAlerts} />);

    const priorities = screen.getAllByText(/#/);

    expect(priorities[0]).toHaveTextContent('#1');
    expect(priorities[1]).toHaveTextContent('#2');
  });
});
