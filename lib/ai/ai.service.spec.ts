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
      projection: null,
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
      projection: null,
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

  it('falls back to plain text when JSON parsing fails or actions are invalid', async () => {
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
      projection: null,
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

    expect(response.reply).toContain('reply');
    expect(response.meta?.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('schema invalid')])
    );
  });
});
