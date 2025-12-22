import { describe, it, expect } from 'vitest';

import { calculateProjection } from './calculator';
import type { DeferredStatus } from './types';

const buildDeferredTransaction = (
  overrides: Partial<Record<string, unknown>>
) => ({
  id: 'deferred-test',
  account: 'SG',
  type: 'EXPENSE' as const,
  amount: -500,
  date: '2024-01-10',
  isDeferred: true,
  deferredTo: '2024-02',
  priority: 5,
  deferredStatus: 'PENDING' as DeferredStatus,
  maxDeferralMonths: 2,
  deferredUntil: '2024-02',
  ...overrides,
});

describe('advanced deferred handling', () => {
  it('marks a deferred expense as APPLIED when within its window', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [buildDeferredTransaction({ amount: -300, priority: 1 })],
      recurringCharges: [],
      startMonth: '2024-02',
      months: 1,
    });

    expect(projection[0].deferredResolutions).toHaveLength(1);
    expect(projection[0].deferredResolutions[0].status).toBe('APPLIED');
  });

  it('forces a deferred expense when maxDeferralMonths is exceeded', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [
        buildDeferredTransaction({
          id: 'forceable',
          deferredUntil: '2024-02',
          deferredStatus: 'PENDING',
          maxDeferralMonths: 0,
        }),
      ],
      recurringCharges: [],
      startMonth: '2024-03',
      months: 1,
    });

    expect(projection[0].deferredResolutions[0].status).toBe('FORCED');
  });

  it('orders deferred expenses in ascending priority', () => {
    const priorityLow = buildDeferredTransaction({ id: 'priority-low', priority: 8 });
    const priorityHigh = buildDeferredTransaction({ id: 'priority-high', priority: 2 });

    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [priorityLow, priorityHigh],
      recurringCharges: [],
      startMonth: '2024-02',
      months: 1,
    });

    const order = projection[0].deferredResolutions.map((resolution) => resolution.transactionId);
    expect(order).toEqual(['priority-high', 'priority-low']);
  });

  it('increases deficit when deferred expenses consume the balance', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [buildDeferredTransaction({ amount: -1200 })],
      recurringCharges: [],
      startMonth: '2024-02',
      months: 2,
    });

    expect(projection[0].endingBalance).toBeLessThan(0);
    expect(projection[1].carriedOverDeficit).toBe(Math.abs(projection[0].endingBalance));
  });

  it('produces the same projection on repeated runs', () => {
    const input = {
      account: 'SG',
      initialBalance: 100,
      transactions: [buildDeferredTransaction({ amount: -200 })],
      recurringCharges: [],
      startMonth: '2024-02',
      months: 1,
    };

    const first = calculateProjection(input);
    const second = calculateProjection(input);
    expect(first).toEqual(second);
  });
});
