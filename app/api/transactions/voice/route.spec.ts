import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/engine-service', () => {
  throw new Error('engine must not be imported by /api/transactions/voice');
});

vi.mock('@/lib/supabase/server', () => ({
  serverSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/auth')>();
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(),
  };
});

import { POST } from './route';

describe('POST /api/transactions/voice', () => {
  it('returns 401 when unauthenticated', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost/api/transactions/voice', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-01-05',
        label: 'Courses',
        amount: 10,
        category: 'Courses',
        account: 'SG',
        type: 'EXPENSE',
      }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid payload', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);

    const request = new NextRequest('http://localhost/api/transactions/voice', {
      method: 'POST',
      body: JSON.stringify({
        label: 'Courses',
        amount: 10,
        category: 'Courses',
        account: 'SG',
        type: 'EXPENSE',
      }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(body.error).toContain('date');
  });

  it('returns 201 and inserts exactly the provided payload when valid', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'tx-123',
        user_id: 'user-123',
        date: '2026-01-05',
        label: 'Courses',
        amount: 10,
        category: 'Courses',
        account: 'SG',
        type: 'EXPENSE',
        is_deferred: false,
        deferred_to: null,
        deferred_until: null,
        max_deferral_months: null,
        priority: 9,
        budget_id: null,
      },
      error: null,
    });

    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: mockSingle,
      })),
    }));

    const { serverSupabaseAdmin } = await import('@/lib/supabase/server');
    vi.mocked(serverSupabaseAdmin).mockReturnValue({
      from: vi.fn(() => ({
        insert: mockInsert,
      })),
    } as never);

    const payload = {
      date: '2026-01-05',
      label: 'Courses',
      amount: 10,
      category: 'Courses',
      account: 'SG',
      type: 'EXPENSE',
    };

    const request = new NextRequest('http://localhost/api/transactions/voice', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const body = (await response.json()) as { transaction?: Record<string, unknown> };

    expect(response.status).toBe(201);
    expect(body.transaction).toBeDefined();
    expect(mockInsert).toHaveBeenCalledWith({ user_id: 'user-123', ...payload });
    expect(mockSingle).toHaveBeenCalledOnce();
  });
});

