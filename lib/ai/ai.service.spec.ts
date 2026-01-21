import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/ai/ai.context', () => ({
  buildAiContext: vi.fn(),
}));

vi.mock('@/lib/ai/ai.transport', () => ({
  callRemoteAI: vi.fn(),
}));

import { chatAi } from './ai.service';

describe('chatAi', () => {
  it('falls back to plain text when JSON parsing fails', async () => {
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

    vi.mocked(callRemoteAI).mockResolvedValue('plain text response');

    const response = await chatAi({
      userId: 'user-123',
      message: 'Hello',
      contextWindowMonths: 6,
      cookies: 'session=abc',
    });

    expect(response.reply).toBe('plain text response');
    expect(response.meta?.toolsUsed).toContain('rest');
  });
});
