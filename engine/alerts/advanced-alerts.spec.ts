import { describe, it, expect } from 'vitest';

import { generateAdvancedAlerts } from './advanced-alerts';
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

describe('generateAdvancedAlerts', () => {
  it('groups alerts by domain and category while applying the documented severities', () => {
    const projection = [
      {
        ...baseProjection,
        month: '2024-02',
        endingBalance: -15,
        ceilings: [
          { ruleId: 'c1', month: '2024-02', ceiling: 100, totalOutflow: 120, state: 'EXCEEDED' as const },
          { ruleId: 'c2', month: '2024-02', ceiling: 150, totalOutflow: 150, state: 'REACHED' as const },
        ],
        deferredResolutions: [
          {
            transactionId: 'd1',
            month: '2024-02',
            amount: 20,
            status: 'FORCED' as const,
            priority: 1,
            forced: true,
            category: 'groceries',
          },
        ],
        categoryBudgets: [
          { category: 'groceries', budget: 100, spent: 90, remaining: 10, status: 'WARNING' as const },
          { category: 'rent', budget: 300, spent: 320, remaining: -20, status: 'EXCEEDED' as const },
        ],
        trends: [
          {
            category: 'groceries',
            current: 90,
            previous: 60,
            delta: 30,
            percentChange: 0.5,
            trend: 'INCREASING' as const,
          },
          {
            category: 'rent',
            current: 320,
            previous: 310,
            delta: 10,
            percentChange: 0.032,
            trend: 'STABLE' as const,
          },
        ],
      },
    ];

    const alerts = generateAdvancedAlerts(projection);
    const indexByRuleId = Object.fromEntries(alerts.map((alert) => [alert.ruleId, alert]));

    expect(indexByRuleId['DEFICIT:NEGATIVE:2024-02']?.severity).toBe('CRITICAL');
    expect(indexByRuleId['CEILING:c1:EXCEEDED:2024-02']?.severity).toBe('CRITICAL');
    expect(indexByRuleId['CEILING:c2:REACHED:2024-02']?.severity).toBe('WARNING');
    expect(indexByRuleId['DEFERRED:FORCED:2024-02:d1']?.domain).toBe('DEFERRED');
    expect(indexByRuleId['DEFERRED:FORCED:2024-02:d1']?.category).toBe('groceries');
    expect(indexByRuleId['DEFERRED:FORCED:2024-02:d1']?.groupId).toBe('DEFERRED:groceries');

    expect(indexByRuleId['BUDGET:groceries:WARNING:2024-02']?.severity).toBe('WARNING');
    expect(indexByRuleId['BUDGET:groceries:WARNING:2024-02']?.groupId).toBe('BUDGET:groceries');
    expect(indexByRuleId['BUDGET:rent:EXCEEDED:2024-02']?.severity).toBe('CRITICAL');

    expect(indexByRuleId['TREND:groceries:2024-02']?.severity).toBe('WARNING');
    expect(indexByRuleId['TREND:groceries:2024-02']?.category).toBe('groceries');
    expect(indexByRuleId['TREND:groceries:2024-02']?.groupId).toBe('TREND:groceries');
    expect(indexByRuleId['TREND:rent:2024-02']).toBeUndefined();
  });

  it('sorts alerts by severity, domain, category and ruleId while exposing a priorityRank', () => {
    const projection = [
      {
        ...baseProjection,
        month: '2024-03',
        endingBalance: -50,
        ceilings: [
          { ruleId: 'ceilingA', month: '2024-03', ceiling: 100, totalOutflow: 120, state: 'EXCEEDED' as const },
        ],
        deferredResolutions: [
          {
            transactionId: 'df1',
            month: '2024-03',
            amount: 30,
            status: 'FORCED' as const,
            priority: 1,
            forced: true,
          },
        ],
        categoryBudgets: [
          { category: 'a-budget', budget: 50, spent: 70, remaining: -20, status: 'EXCEEDED' as const },
          { category: 'm-budget', budget: 120, spent: 100, remaining: 20, status: 'WARNING' as const },
          { category: 'z-budget', budget: 120, spent: 110, remaining: 10, status: 'WARNING' as const },
        ],
        trends: [
          {
            category: 'm-budget',
            current: 100,
            previous: 70,
            delta: 30,
            percentChange: 0.42,
            trend: 'INCREASING' as const,
          },
        ],
      },
    ];

    const alerts = generateAdvancedAlerts(projection);
    const description = alerts.map((alert) => ({
      rank: alert.priorityRank,
      detail: `${alert.severity}:${alert.domain}:${alert.category ?? ''}:${alert.ruleId}`,
    }));

    expect(description.map((entry) => entry.rank)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(description.map((entry) => entry.detail)).toEqual([
      'CRITICAL:DEFICIT::DEFICIT:NEGATIVE:2024-03',
      'CRITICAL:CEILING::CEILING:ceilingA:EXCEEDED:2024-03',
      'CRITICAL:BUDGET:a-budget:BUDGET:a-budget:EXCEEDED:2024-03',
      'WARNING:DEFERRED::DEFERRED:FORCED:2024-03:df1',
      'WARNING:BUDGET:m-budget:BUDGET:m-budget:WARNING:2024-03',
      'WARNING:BUDGET:z-budget:BUDGET:z-budget:WARNING:2024-03',
      'WARNING:TREND:m-budget:TREND:m-budget:2024-03',
    ]);
  });

  it('produces deterministic, non-regressive alerts without mutating the projection', () => {
    const projection = [
      {
        ...baseProjection,
        month: '2024-04',
        endingBalance: -80,
        deferredResolutions: [
          {
            transactionId: 'force-2024-04',
            month: '2024-04',
            amount: 40,
            status: 'FORCED' as const,
            priority: 1,
            forced: true,
          },
        ],
      },
    ];
    const snapshot = JSON.stringify(projection);

    const first = generateAdvancedAlerts(projection);
    const second = generateAdvancedAlerts(projection);

    expect(first).toEqual(second);
    expect(JSON.stringify(projection)).toBe(snapshot);
    expect(first.every((alert) => typeof alert.priorityRank === 'number')).toBe(true);
  });
});
