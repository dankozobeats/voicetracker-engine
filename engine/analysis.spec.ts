import { describe, it, expect } from 'vitest';

import { analyzeProjection } from './analysis';
import { EngineAlert } from './types';

const baseProjection = {
  month: '2024-01',
  openingBalance: 0,
  income: 0,
  expenses: 0,
  fixedCharges: 0,
  deferredIn: 0,
  carriedOverDeficit: 0,
  endingBalance: 0,
  ceilings: [],
  deferredResolutions: [],
  categoryBudgets: [
    { category: 'alimentation', budget: 100, spent: 90, remaining: 10, status: 'WARNING' as const },
  ],
};

describe('analysis layer', () => {
  it('produces deterministic insights without mutating inputs', () => {
    const projections = [baseProjection];
    const alerts: EngineAlert[] = [];
    const before = JSON.stringify(projections);

    const first = analyzeProjection(projections, alerts);
    const second = analyzeProjection(projections, alerts);

    expect(first).toEqual(second);
    expect(JSON.stringify(projections)).toBe(before);
  });

  it('generates insights matching alerts', () => {
    const projections = [
      {
        ...baseProjection,
        month: '2024-01',
        categoryBudgets: [
          { category: 'alimentation', budget: 100, spent: 110, remaining: -10, status: 'EXCEEDED' as const },
        ],
      },
    ];
    const alerts: EngineAlert[] = [
      {
        type: 'CATEGORY_BUDGET_EXCEEDED',
        level: 'CRITICAL',
        sourceModule: 'category-budget',
        month: '2024-01',
        metadata: { category: 'alimentation', budget: 100, spent: 110 },
      },
      {
        type: 'DEFERRED_FORCED',
        level: 'INFO',
        sourceModule: 'deferred',
        month: '2024-01',
        metadata: { transactionId: 'd1', amount: 50 },
      },
    ];

    const result = analyzeProjection(projections, alerts);
    expect(result.insights).toContain('Le budget alimentation est régulièrement dépassé');
    expect(result.insights).toContain('Les différés forcés indiquent une tension de trésorerie');
  });
});
