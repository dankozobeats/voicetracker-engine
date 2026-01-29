import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/ai/ai.context', () => ({
  buildAiContext: vi.fn(),
}));

vi.mock('@/lib/ai/ai.transport', () => ({
  callRemoteAI: vi.fn(),
}));

import { chatAi } from './ai.service';

describe('chatAi', () => {
  it('returns structured response when JSON includes valid proposedActions', async () => {
    const { buildAiContext } = await import('@/lib/ai/ai.context');
    const { callRemoteAI } = await import('@/lib/ai/ai.transport');

    vi.mocked(buildAiContext).mockResolvedValue({
      generatedAt: new Date().toISOString(),
      transactions: [],
      recurringCharges: [],
      ceilingRules: [],
      budgets: null,
      debts: [],
      credits: [],
      accountBalances: [],
      projection: { SG: null, FLOA: null },
    });

    vi.mocked(callRemoteAI).mockResolvedValue(
      JSON.stringify({
        reply: 'Ok',
        proposedActions: [
          {
            type: 'note',
            title: 'Review',
            requiresConfirmation: true,
          },
        ],
      })
    );

    const response = await chatAi({
      userId: 'user-123',
      message: 'Hello',
      contextWindowMonths: 6,
      cookies: 'session=abc',
    });

    expect(response.reply).toBe('Ok');
    expect(response.proposedActions).toHaveLength(1);
    expect(response.proposedActions?.[0]?.requiresConfirmation).toBe(true);
  });

  it('normalizes missing insights/proposedActions to empty arrays', async () => {
    const { buildAiContext } = await import('@/lib/ai/ai.context');
    const { callRemoteAI } = await import('@/lib/ai/ai.transport');

    vi.mocked(buildAiContext).mockResolvedValue({
      generatedAt: new Date().toISOString(),
      transactions: [],
      recurringCharges: [],
      ceilingRules: [],
      budgets: null,
      debts: [],
      credits: [],
      accountBalances: [],
      projection: { SG: null, FLOA: null },
    });

    vi.mocked(callRemoteAI).mockResolvedValue(
      JSON.stringify({
        reply: 'Ok',
      })
    );

    const response = await chatAi({
      userId: 'user-123',
      message: 'Hello',
      contextWindowMonths: 6,
      cookies: 'session=abc',
    });

    expect(response.reply).toBe('Ok');
    expect(response.insights).toEqual([]);
    expect(response.proposedActions).toEqual([]);
  });

  it('extracts reply from JSON even when other fields are invalid', async () => {
    const { buildAiContext } = await import('@/lib/ai/ai.context');
    const { callRemoteAI } = await import('@/lib/ai/ai.transport');

    vi.mocked(buildAiContext).mockResolvedValue({
      generatedAt: new Date().toISOString(),
      transactions: [],
      recurringCharges: [],
      ceilingRules: [],
      budgets: null,
      debts: [],
      credits: [],
      accountBalances: [],
      projection: { SG: null, FLOA: null },
    });

    vi.mocked(callRemoteAI).mockResolvedValue(
      JSON.stringify({
        reply: 'Ok',
        proposedActions: [
          {
            type: 'note',
            title: 'Invalid',
            requiresConfirmation: false,
          },
        ],
      })
    );

    const response = await chatAi({
      userId: 'user-123',
      message: 'Hello',
      contextWindowMonths: 6,
      cookies: 'session=abc',
    });

    // reply is extracted even if proposedActions has invalid items
    expect(response.reply).toBe('Ok');
  });

  it('falls back to raw text when response is not JSON', async () => {
    const { buildAiContext } = await import('@/lib/ai/ai.context');
    const { callRemoteAI } = await import('@/lib/ai/ai.transport');

    vi.mocked(buildAiContext).mockResolvedValue({
      generatedAt: new Date().toISOString(),
      transactions: [],
      recurringCharges: [],
      ceilingRules: [],
      budgets: null,
      debts: [],
      credits: [],
      accountBalances: [],
      projection: { SG: null, FLOA: null },
    });

    vi.mocked(callRemoteAI).mockResolvedValue('Voici mon analyse de vos finances.');

    const response = await chatAi({
      userId: 'user-123',
      message: 'Hello',
      contextWindowMonths: 6,
      cookies: 'session=abc',
    });

    expect(response.reply).toBe('Voici mon analyse de vos finances.');
    expect(response.insights).toEqual([]);
    expect(response.proposedActions).toEqual([]);
  });
});
