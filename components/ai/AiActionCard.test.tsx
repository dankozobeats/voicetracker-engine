import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiActionCard } from './AiActionCard';
import type { AiProposedAction } from '@/lib/ai/ai.types';

describe('AiActionCard', () => {
  it('renders action content and buttons', () => {
    const action: AiProposedAction = {
      type: 'transaction',
      title: 'Ajouter une transaction',
      description: 'Transaction proposee',
      requiresConfirmation: true,
      payload: { amount: 12 },
    };

    render(
      <AiActionCard
        action={action}
        actionId="action-1"
        status="idle"
        onConfirm={vi.fn()}
        onIgnore={vi.fn()}
      />
    );

    expect(screen.getByText('Ajouter une transaction')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ignorer' })).toBeInTheDocument();
  });
});
