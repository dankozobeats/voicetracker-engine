import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

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

import { POST } from './route';

describe('POST /api/ai/confirm', () => {
  it('returns 401 when unauthenticated', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { auditLogUnauthorized } = await import('@/lib/audit-logger');

    vi.mocked(getAuthenticatedUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost/api/ai/confirm', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(auditLogUnauthorized).toHaveBeenCalledOnce();
  });

  it('returns 400 for invalid payload', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { auditLogFailure } = await import('@/lib/audit-logger');

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);

    const request = new NextRequest('http://localhost/api/ai/confirm', {
      method: 'POST',
      body: JSON.stringify({ type: 'CREATE_TRANSACTION' }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid payload');
    expect(auditLogFailure).toHaveBeenCalledOnce();
  });

  it('returns 200 for valid action', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { confirmAiAction } = await import('@/lib/ai/ai.confirm.service');

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);
    vi.mocked(confirmAiAction).mockResolvedValue({
      status: 'success',
      httpStatus: 200,
      result: { ok: true },
    });

    const request = new NextRequest('http://localhost/api/ai/confirm', {
      method: 'POST',
      body: JSON.stringify({
        actionId: 'action-1',
        type: 'RUN_PROJECTION',
        payload: { month: '2024-06', months: 3 },
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { status?: string };

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
  });

  it('returns 400 for invalid action type', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-123' } as never);

    const request = new NextRequest('http://localhost/api/ai/confirm', {
      method: 'POST',
      body: JSON.stringify({
        actionId: 'action-1',
        type: 'INVALID',
        payload: {},
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
