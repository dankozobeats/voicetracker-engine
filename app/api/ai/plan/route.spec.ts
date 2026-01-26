import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { AiPlanStep } from '@/lib/ai/ai.types';

vi.mock('@/lib/api/auth', () => ({
  getAuthenticatedUser: vi.fn(),
  unauthorized: () =>
    new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
}));

vi.mock('@/lib/audit-logger', () => ({
  auditLog: vi.fn(),
  auditLogFailure: vi.fn(),
  auditLogUnauthorized: vi.fn(),
}));

vi.mock('@/lib/ai/ai.plan.service', () => ({
  buildAiPlan: vi.fn(),
}));

vi.mock('@/lib/ai/ai.plan.repository', () => ({
  createPlan: vi.fn(),
}));

import { POST } from './route';

describe('POST /api/ai/plan', () => {
  it('returns 401 when unauthenticated', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');

    vi.mocked(getAuthenticatedUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost/api/ai/plan', {
      method: 'POST',
      body: JSON.stringify({ message: 'Plan' }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid payload', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);

    const request = new NextRequest('http://localhost/api/ai/plan', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid payload');
  });

  it('returns 200 with plan data', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { buildAiPlan } = await import('@/lib/ai/ai.plan.service');
    const { createPlan } = await import('@/lib/ai/ai.plan.repository');

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);

    const steps: AiPlanStep[] = [
      {
        step: 1,
        action: 'RUN_PROJECTION',
        payload: { month: '2024-06', months: 3 },
        requiresConfirmation: true,
        actionId: 'action-1',
        status: 'PENDING',
      },
    ];

    vi.mocked(buildAiPlan).mockResolvedValue({
      steps,
      meta: { contextWindowMonths: 6, toolsUsed: ['rest'] },
    });

    vi.mocked(createPlan).mockResolvedValue({
      planId: 'plan-1',
      userId: 'user-123',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00.000Z',
      expiresAt: '2024-01-01T00:30:00.000Z',
      steps,
    });

    const request = new NextRequest('http://localhost/api/ai/plan', {
      method: 'POST',
      body: JSON.stringify({ message: 'Plan', contextWindowMonths: 6 }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { planId?: string };

    expect(response.status).toBe(200);
    expect(data.planId).toBe('plan-1');
  });

  it('returns 400 when plan exceeds max steps', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { buildAiPlan } = await import('@/lib/ai/ai.plan.service');

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);

    vi.mocked(buildAiPlan).mockResolvedValue({
      error: 'Plan exceeds max step count',
      meta: { contextWindowMonths: 6, toolsUsed: ['rest'] },
    });

    const request = new NextRequest('http://localhost/api/ai/plan', {
      method: 'POST',
      body: JSON.stringify({ message: 'Plan' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
