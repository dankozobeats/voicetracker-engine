import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  serverSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
  createSupabaseServerClient: vi.fn(),
}));

describe('POST /api/budgets', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('requires authentication', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as never);

    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        category: 'Alimentation',
        amount: 600,
        period: 'MONTHLY',
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('validates required fields', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    } as never);

    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('validates period enum', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    } as never);

    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        category: 'Alimentation',
        amount: 600,
        period: 'INVALID',
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toContain('MONTHLY, ROLLING, MULTI');
  });

  it('validates amount > 0', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    } as never);

    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        category: 'Alimentation',
        amount: 0,
        period: 'MONTHLY',
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toContain('greater than 0');
  });

  it('validates MULTI period requires dates', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    } as never);

    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        category: 'Projets',
        amount: 3000,
        period: 'MULTI',
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toContain('startDate and endDate are required');
  });

  it('validates endDate after startDate', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    } as never);

    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        category: 'Projets',
        amount: 3000,
        period: 'MULTI',
        startDate: '2024-06-01',
        endDate: '2024-01-01',
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toContain('endDate must be after startDate');
  });

  it('inserts budget with correct user_id', async () => {
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'budget-123',
            user_id: 'user-123',
            category: 'Alimentation',
            amount: 600,
            period: 'MONTHLY',
            start_date: null,
            end_date: null,
            created_at: '2024-03-15T10:00:00Z',
          },
          error: null,
        }),
      })),
    }));

    const { serverSupabase, createSupabaseServerClient } = await import('@/lib/supabase/server');
    vi.mocked(serverSupabase).mockReturnValue({
      from: vi.fn(() => ({
        insert: mockInsert,
      })),
    } as never);

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    } as never);

    const request = new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        category: 'Alimentation',
        amount: 600,
        period: 'MONTHLY',
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { budget?: unknown };

    expect(response.status).toBe(201);
    expect(data.budget).toBeDefined();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123', // Vérifier que user_id est injecté depuis l'auth
        category: 'Alimentation',
        amount: 600,
        period: 'MONTHLY',
      })
    );
  });
});

