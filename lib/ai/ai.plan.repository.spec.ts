import { describe, expect, it, vi } from 'vitest';
import type { AiPlanStep } from './ai.types';

vi.mock('@/lib/supabase/server', () => ({
  serverSupabaseAdmin: vi.fn(),
}));

import { createPlan, getPlanWithSteps, isPlanExpired, markPlanExpired, updateStepStatus } from './ai.plan.repository';

describe('ai.plan.repository', () => {
  it('creates plan and steps', async () => {
    const { serverSupabaseAdmin } = await import('@/lib/supabase/server');

    const insertPlan = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'plan-1',
            user_id: 'user-123',
            status: 'ACTIVE',
            created_at: '2024-01-01T00:00:00.000Z',
            expires_at: '2024-01-01T00:30:00.000Z',
          },
          error: null,
        }),
      }),
    });

    const insertSteps = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(serverSupabaseAdmin).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'ai_plans') {
          return { insert: insertPlan };
        }
        return { insert: insertSteps };
      }),
    } as never);

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

    const plan = await createPlan({
      userId: 'user-123',
      steps,
      expiresAt: '2024-01-01T00:30:00.000Z',
    });

    expect(plan.planId).toBe('plan-1');
    expect(plan.steps).toHaveLength(1);
  });

  it('returns plan with steps', async () => {
    const { serverSupabaseAdmin } = await import('@/lib/supabase/server');

    const selectPlan = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'plan-1',
              user_id: 'user-123',
              status: 'ACTIVE',
              created_at: '2024-01-01T00:00:00.000Z',
              expires_at: '2024-01-01T00:30:00.000Z',
            },
            error: null,
          }),
        }),
      }),
    });

    const selectSteps = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'action-1',
              plan_id: 'plan-1',
              step_index: 1,
              action_type: 'RUN_PROJECTION',
              payload: { month: '2024-06', months: 3 },
              status: 'PENDING',
              created_at: '2024-01-01T00:00:00.000Z',
              confirmed_at: null,
            },
          ],
          error: null,
        }),
      }),
    });

    vi.mocked(serverSupabaseAdmin).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'ai_plans') {
          return { select: selectPlan };
        }
        return { select: selectSteps };
      }),
    } as never);

    const plan = await getPlanWithSteps('plan-1', 'user-123');

    expect(plan?.steps).toHaveLength(1);
  });

  it('marks plan expired based on timestamp', () => {
    const plan = {
      planId: 'plan-1',
      userId: 'user-123',
      status: 'ACTIVE' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      expiresAt: '2024-01-01T00:00:01.000Z',
      steps: [],
    };

    expect(isPlanExpired(plan, new Date('2024-01-01T00:00:02.000Z').getTime())).toBe(true);
  });

  it('updates plan and step status', async () => {
    const { serverSupabaseAdmin } = await import('@/lib/supabase/server');

    const updatePlan = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const updateStep = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    vi.mocked(serverSupabaseAdmin).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'ai_plans') {
          return { update: updatePlan };
        }
        return { update: updateStep };
      }),
    } as never);

    await markPlanExpired('plan-1');
    await updateStepStatus('plan-1', 1, 'CONFIRMED');

    expect(updatePlan).toHaveBeenCalledOnce();
    expect(updateStep).toHaveBeenCalledOnce();
  });
});
