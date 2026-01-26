import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { AiPlan } from '@/lib/ai/ai.types';

vi.mock('@/lib/api/auth', () => ({
  getAuthenticatedUser: vi.fn(),
  unauthorized: () =>
    new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
}));

vi.mock('@/lib/audit-logger', () => ({
  auditLogFailure: vi.fn(),
  auditLogUnauthorized: vi.fn(),
}));

vi.mock('@/lib/ai/ai.confirm.service', () => ({
  confirmAiAction: vi.fn(),
}));

vi.mock('@/lib/ai/ai.plan.repository', () => ({
  getPlanWithSteps: vi.fn(),
  getStep: vi.fn(),
  isPlanExpired: vi.fn(),
  markPlanExpired: vi.fn(),
  updateStepStatus: vi.fn(),
}));

import { POST } from './route';

describe('POST /api/ai/confirm (plan mode)', () => {
  it('returns 400 for out-of-order step', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getPlanWithSteps, getStep, isPlanExpired } = await import('@/lib/ai/ai.plan.repository');

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);

    const plan: AiPlan = {
      planId: 'plan-1',
      userId: 'user-123',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00.000Z',
      expiresAt: '2024-01-01T00:30:00.000Z',
      steps: [
        {
          step: 1,
          action: 'RUN_PROJECTION',
          payload: { month: '2024-06', months: 3 },
          requiresConfirmation: true,
          actionId: 'action-1',
          status: 'PENDING',
        },
        {
          step: 2,
          action: 'CREATE_BUDGET',
          payload: { category: 'Food', amount: 200, period: 'MONTHLY' },
          requiresConfirmation: true,
          actionId: 'action-2',
          status: 'PENDING',
        },
      ],
    };

    vi.mocked(getPlanWithSteps).mockResolvedValue(plan);
    vi.mocked(isPlanExpired).mockReturnValue(false);
    vi.mocked(getStep).mockImplementation((currentPlan, stepNumber) =>
      currentPlan.steps.find((entry) => entry.step === stepNumber)
    );

    const request = new NextRequest('http://localhost/api/ai/confirm', {
      method: 'POST',
      body: JSON.stringify({ planId: 'plan-1', step: 2 }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 200 for confirmed step', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getPlanWithSteps, getStep, updateStepStatus, isPlanExpired } = await import('@/lib/ai/ai.plan.repository');
    const { confirmAiAction } = await import('@/lib/ai/ai.confirm.service');

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);

    const plan: AiPlan = {
      planId: 'plan-1',
      userId: 'user-123',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00.000Z',
      expiresAt: '2024-01-01T00:30:00.000Z',
      steps: [
        {
          step: 1,
          action: 'RUN_PROJECTION',
          payload: { month: '2024-06', months: 3 },
          requiresConfirmation: true,
          actionId: 'action-1',
          status: 'PENDING',
        },
      ],
    };

    vi.mocked(getPlanWithSteps).mockResolvedValue(plan);
    vi.mocked(isPlanExpired).mockReturnValue(false);
    vi.mocked(getStep).mockImplementation((currentPlan, stepNumber) =>
      currentPlan.steps.find((entry) => entry.step === stepNumber)
    );

    vi.mocked(confirmAiAction).mockResolvedValue({
      status: 'success',
      httpStatus: 200,
      result: { ok: true },
    });

    const request = new NextRequest('http://localhost/api/ai/confirm', {
      method: 'POST',
      body: JSON.stringify({ planId: 'plan-1', step: 1 }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { status?: string };

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(updateStepStatus).toHaveBeenCalledWith('plan-1', 1, 'CONFIRMED');
  });

  it('returns 409 when step already confirmed', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getPlanWithSteps, getStep, isPlanExpired } = await import('@/lib/ai/ai.plan.repository');

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);

    const plan: AiPlan = {
      planId: 'plan-1',
      userId: 'user-123',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00.000Z',
      expiresAt: '2024-01-01T00:30:00.000Z',
      steps: [
        {
          step: 1,
          action: 'RUN_PROJECTION',
          payload: { month: '2024-06', months: 3 },
          requiresConfirmation: true,
          actionId: 'action-1',
          status: 'CONFIRMED',
        },
      ],
    };

    vi.mocked(getPlanWithSteps).mockResolvedValue(plan);
    vi.mocked(isPlanExpired).mockReturnValue(false);
    vi.mocked(getStep).mockImplementation((currentPlan, stepNumber) =>
      currentPlan.steps.find((entry) => entry.step === stepNumber)
    );

    const request = new NextRequest('http://localhost/api/ai/confirm', {
      method: 'POST',
      body: JSON.stringify({ planId: 'plan-1', step: 1 }),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
  });

  it('returns 410 when plan expired', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getPlanWithSteps, isPlanExpired } = await import('@/lib/ai/ai.plan.repository');

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);
    vi.mocked(getPlanWithSteps).mockResolvedValue({
      planId: 'plan-1',
      userId: 'user-123',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00.000Z',
      expiresAt: '2024-01-01T00:00:00.000Z',
      steps: [],
    });
    vi.mocked(isPlanExpired).mockReturnValue(true);

    const request = new NextRequest('http://localhost/api/ai/confirm', {
      method: 'POST',
      body: JSON.stringify({ planId: 'plan-1', step: 1 }),
    });

    const response = await POST(request);

    expect(response.status).toBe(410);
  });
});
