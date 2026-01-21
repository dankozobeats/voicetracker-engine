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

vi.mock('@/lib/ai/ai.service', () => ({
  chatAi: vi.fn(),
}));

import { POST } from './route';

describe('POST /api/ai/chat', () => {
  it('returns 401 when unauthenticated', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid payload', async () => {
    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid payload');
  });
});
