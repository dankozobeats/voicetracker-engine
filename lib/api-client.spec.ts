import type { EnginePayload } from './types';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { fetchAnalysisPayload } from './api-client';

const mockPayload: EnginePayload = {
  months: [],
  balances: [],
  categoryBudgets: [],
  rollingBudgets: [],
  multiMonthBudgets: [],
  trends: [],
  alertTexts: [],
};

describe('fetchAnalysisPayload', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('resolves the JSON payload when the response is OK', async () => {
    const response = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockPayload),
    } as unknown as Response;

    global.fetch = vi.fn().mockResolvedValue(response);

    await expect(fetchAnalysisPayload('https://example.com')).resolves.toEqual(mockPayload);

    expect(response.json).toHaveBeenCalled();
  });

  it('throws HTTP_ERROR when response is not OK', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as unknown as Response);

    await expect(fetchAnalysisPayload('https://example.com')).rejects.toMatchObject({
      code: 'HTTP_ERROR',
    });
  });

  it('throws INVALID_JSON when json() rejects', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new Error('no json')),
    } as unknown as Response);

    await expect(fetchAnalysisPayload('https://example.com')).rejects.toMatchObject({
      code: 'INVALID_JSON',
    });
  });

  it('throws NETWORK_ERROR when fetch rejects with TypeError', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('network down'));

    await expect(fetchAnalysisPayload('https://example.com')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('throws TIMEOUT when request aborts', async () => {
    vi.useFakeTimers();

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }
      });
    });

    const promise = fetchAnalysisPayload('https://example.com', { timeoutMs: 10 });
    const swallow = promise.catch(() => {
      /* suppress unhandled rejection */
    });

    vi.advanceTimersByTime(20);
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toMatchObject({
      code: 'TIMEOUT',
    });

    await swallow;
  });
});
