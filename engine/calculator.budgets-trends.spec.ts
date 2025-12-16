import { describe, it, expect } from 'vitest';

import { calculateProjection } from './calculator';

const buildExpense = (amount: number, month: string, category = 'groceries') => ({
  id: `${category}-${month}-${amount}`,
  account: 'SG' as const,
  type: 'EXPENSE' as const,
  amount: -amount,
  date: `${month}-05`,
  category,
});

const groceriesBudget = { category: 'groceries', budget: 200 };

describe('budget trends', () => {
  it('flags INCREASING when spending climbs beyond 5%', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [buildExpense(50, '2024-01'), buildExpense(70, '2024-02')],
      recurringCharges: [],
      categoryBudgets: [groceriesBudget],
      startMonth: '2024-01',
      months: 2,
    });

    const trends = projection[1].trends ?? [];
    const groceriesTrend = trends.find((entry) => entry.category === 'groceries');

    expect(groceriesTrend?.trend).toBe('INCREASING');
    expect(groceriesTrend?.current).toBe(70);
    expect(groceriesTrend?.previous).toBe(50);
    expect(groceriesTrend?.percentChange).toBeCloseTo(0.4);
  });

  it('flags DECREASING when spending drops more than the 5% threshold', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [buildExpense(100, '2024-01'), buildExpense(80, '2024-02')],
      recurringCharges: [],
      categoryBudgets: [groceriesBudget],
      startMonth: '2024-01',
      months: 2,
    });

    const trend = projection[1].trends?.find((entry) => entry.category === 'groceries');
    expect(trend?.trend).toBe('DECREASING');
  });

  it('considers spending STABLE when month-on-month change stays within 5%', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [buildExpense(100, '2024-01'), buildExpense(104, '2024-02')],
      recurringCharges: [],
      categoryBudgets: [groceriesBudget],
      startMonth: '2024-01',
      months: 2,
    });

    const trend = projection[1].trends?.find((entry) => entry.category === 'groceries');
    expect(trend?.trend).toBe('STABLE');
    expect(trend?.percentChange).toBeCloseTo(0.04);
  });

  it('returns NO_HISTORY for the first month and stays deterministic', () => {
    const input = {
      account: 'SG',
      initialBalance: 0,
      transactions: [buildExpense(40, '2024-01')],
      recurringCharges: [],
      categoryBudgets: [groceriesBudget],
      startMonth: '2024-01',
      months: 1,
    };

    const first = calculateProjection(input);
    const trend = first[0].trends?.find((entry) => entry.category === 'groceries');
    expect(trend?.trend).toBe('NO_HISTORY');
    expect(trend?.percentChange).toBe(0);

    const second = calculateProjection(input);
    expect(second[0].trends).toEqual(first[0].trends);
  });

  it('evaluates each category independently', () => {
    const utilitiesBudget = { category: 'utilities', budget: 180 };

    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [
        buildExpense(60, '2024-01', 'groceries'),
        buildExpense(80, '2024-01', 'utilities'),
        buildExpense(72, '2024-02', 'groceries'),
        buildExpense(65, '2024-02', 'utilities'),
      ],
      recurringCharges: [],
      categoryBudgets: [groceriesBudget, utilitiesBudget],
      startMonth: '2024-01',
      months: 2,
    });

    const trends = projection[1].trends ?? [];
    const groceriesTrend = trends.find((entry) => entry.category === 'groceries');
    const utilitiesTrend = trends.find((entry) => entry.category === 'utilities');

    expect(groceriesTrend?.trend).toBe('INCREASING');
    expect(utilitiesTrend?.trend).toBe('DECREASING');
  });
});
