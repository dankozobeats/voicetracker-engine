import { describe, expect, it } from 'vitest';

import { monthlySummaryConsumer } from './monthly-summary.consumer';
import type { AdvancedAlert, CategoryBudgetTrendResult } from 'engine/types';

const createAlert = (overrides: Partial<AdvancedAlert> = {}): AdvancedAlert => ({
  month: '2024-03',
  domain: 'BUDGET',
  category: 'Alimentation',
  ruleId: 'BUDGET:2024-03',
  groupId: 'BUDGET:Alimentation',
  severity: 'INFO',
  metadata: undefined,
  priorityRank: 10,
  ...overrides,
});

const createTrend = (overrides: Partial<CategoryBudgetTrendResult> = {}): CategoryBudgetTrendResult => ({
  category: 'Alimentation',
  current: 200,
  previous: 180,
  delta: 20,
  percentChange: 11,
  trend: 'INCREASING',
  ...overrides,
});

describe('monthlySummaryConsumer', () => {
  it('produces deterministic outputs for identical input', () => {
    const input = {
      month: '2024-03',
      alerts: [createAlert({ priorityRank: 5 })],
      trends: [createTrend()],
    };

    const first = monthlySummaryConsumer(input);
    const second = monthlySummaryConsumer(input);

    expect(first).toEqual(second);
  });

  it('never mutates the provided inputs', () => {
    const alerts = [
      createAlert({ ruleId: 'BUDGET:A', priorityRank: 1 }),
      createAlert({ ruleId: 'BUDGET:B', priorityRank: 2 }),
    ];
    const trends = [createTrend({ category: 'Transport' })];
    const input = {
      month: '2024-03',
      alerts,
      trends,
    };

    const snapshot = JSON.parse(JSON.stringify(input));

    monthlySummaryConsumer(input);

    expect(input).toEqual(snapshot);
  });

  it('limits highlights to 3 entries ordered by priorityRank', () => {
    const alerts = [
      createAlert({ priorityRank: 4, category: 'Quatre' }),
      createAlert({ priorityRank: 3, category: 'Trois' }),
      createAlert({ priorityRank: 2, category: 'Deux' }),
      createAlert({ priorityRank: 1, category: 'Un' }),
    ];
    const output = monthlySummaryConsumer({
      month: '2024-03',
      alerts,
      trends: [],
    });

    expect(output.highlights).toHaveLength(3);
    expect(output.highlights).toEqual([
      'Une alerte informelles pour Budget — Un.',
      'Une alerte informelles pour Budget — Deux.',
      'Une alerte informelles pour Budget — Trois.',
    ]);
  });

  it('orders details by severity then priority and includes trend text', () => {
    const alerts = [
      createAlert({ severity: 'WARNING', priorityRank: 10 }),
      createAlert({ severity: 'CRITICAL', priorityRank: 5 }),
    ];
    const trends = [createTrend({ trend: 'INCREASING', percentChange: 12, category: 'Loisirs' })];
    const output = monthlySummaryConsumer({
      month: '2024-03',
      alerts,
      trends,
    });

    expect(output.details[0]).toContain('critique');
    expect(output.details[1]).toContain('vigilance');
    expect(output.details[2]).toContain('La tendance des dépenses pour Loisirs');
  });
});
