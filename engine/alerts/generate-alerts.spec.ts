import { describe, it, expect } from 'vitest';

import { generateAlerts } from './generate-alerts';
import type { MonthProjection } from '../types';

const baseProjection: MonthProjection = {
  month: '2024-01',
  openingBalance: 1000,
  income: 0,
  expenses: 0,
  fixedCharges: 0,
  deferredIn: 0,
  carriedOverDeficit: 0,
  endingBalance: 1000,
  ceilings: [],
  deferredResolutions: [],
  categoryBudgets: [],
};

describe('generateAlerts', () => {
  it('detects deficit lifecycle and worsening', () => {
    const projection: MonthProjection[] = [
      { ...baseProjection, month: '2024-01', endingBalance: 100 },
      { ...baseProjection, month: '2024-02', endingBalance: -50, carriedOverDeficit: 50 },
      { ...baseProjection, month: '2024-03', endingBalance: -200, carriedOverDeficit: 200 },
    ];

    const alerts = generateAlerts(projection);
    const types = alerts.map((alert) => alert.type);
    expect(types).toContain('DEFICIT_STARTED');
    expect(types).toContain('DEFICIT_CARRIED');
    expect(types).toContain('DEFICIT_WORSENING');
  });

  it('captures ceiling, budget, and deferred statuses with metadata', () => {
    const projection: MonthProjection[] = [
      {
        ...baseProjection,
        month: '2024-02',
        endingBalance: -20,
        carriedOverDeficit: 20,
        ceilings: [
          { ruleId: 'c1', month: '2024-02', ceiling: 100, totalOutflow: 100, state: 'REACHED' },
          { ruleId: 'c2', month: '2024-02', ceiling: 50, totalOutflow: 75, state: 'EXCEEDED' },
        ],
        deferredResolutions: [
          { transactionId: 'd1', month: '2024-02', amount: 10, status: 'PENDING', priority: 1, forced: false },
          { transactionId: 'd2', month: '2024-02', amount: 20, status: 'FORCED', priority: 2, forced: true },
          { transactionId: 'd3', month: '2024-02', amount: 5, status: 'EXPIRED', priority: 3, forced: false },
        ],
        categoryBudgets: [
          { category: 'groceries', budget: 100, spent: 85, remaining: 15, status: 'WARNING' },
          { category: 'utilities', budget: 200, spent: 220, remaining: -20, status: 'EXCEEDED' },
        ],
      },
    ];

    const alerts = generateAlerts(projection);
    expect(alerts.find((alert) => alert.type === 'CEILING_REACHED')).toBeDefined();
    expect(alerts.find((alert) => alert.type === 'CEILING_EXCEEDED')).toBeDefined();
    expect(alerts.find((alert) => alert.type === 'DEFERRED_PENDING')).toBeDefined();
    expect(alerts.find((alert) => alert.type === 'DEFERRED_FORCED')).toBeDefined();
    expect(alerts.find((alert) => alert.type === 'DEFERRED_EXPIRED')).toBeDefined();
    expect(alerts.find((alert) => alert.type === 'CATEGORY_BUDGET_WARNING')).toBeDefined();
    expect(alerts.find((alert) => alert.type === 'CATEGORY_BUDGET_EXCEEDED')).toBeDefined();
  });

  it('is deterministic and does not mutate input', () => {
    const projection: MonthProjection[] = [
      {
        ...baseProjection,
        month: '2024-03',
        ceilings: [{ ruleId: 'c1', month: '2024-03', ceiling: 100, totalOutflow: 120, state: 'EXCEEDED' }],
        categoryBudgets: [{ category: 'fuel', budget: 100, spent: 130, remaining: -30, status: 'EXCEEDED' }],
        deferredResolutions: [{ transactionId: 'd1', month: '2024-03', amount: 30, status: 'FORCED', priority: 1, forced: true }],
      },
    ];
    const snapshot = JSON.stringify(projection);

    const first = generateAlerts(projection);
    const second = generateAlerts(projection);

    expect(first).toEqual(second);
    expect(JSON.stringify(projection)).toBe(snapshot);
  });
});
