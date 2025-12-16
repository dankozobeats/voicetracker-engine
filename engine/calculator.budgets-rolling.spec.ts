import { describe, it, expect } from 'vitest';

import { calculateProjection } from './calculator';

const budget = { category: 'groceries', amount: 100, windowMonths: 2 };

const transaction = (amount: number, category = 'groceries') => ({
  id: `txn-${amount}-${category}`,
  account: 'SG',
  type: 'EXPENSE' as const,
  amount: -amount,
  date: '2024-01-10',
  category,
});

describe('rolling budgets', () => {
  it('reports OK when spending remains below 80%', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 1000,
      transactions: [transaction(30)],
      recurringCharges: [],
      categoryBudgets: [],
      rollingBudgets: [budget],
      startMonth: '2024-01',
      months: 1,
    });

    expect(projection[0].rollingBudgets?.[0].status).toBe('OK');
  });

  it('reports WARNING at 80% threshold', () => {
    const transactions = [transaction(40), transaction(40, 'groceries')];
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 1000,
      transactions,
      recurringCharges: [],
      rollingBudgets: [budget],
      startMonth: '2024-01',
      months: 1,
    });

    expect(projection[0].rollingBudgets?.[0].status).toBe('WARNING');
  });

  it('reports REACHED at 100%', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 1000,
      transactions: [transaction(100)],
      recurringCharges: [],
      rollingBudgets: [budget],
      startMonth: '2024-01',
      months: 1,
    });

    expect(projection[0].rollingBudgets?.[0].status).toBe('REACHED');
  });

  it('reports EXCEEDED when spending goes over the budget', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 1000,
      transactions: [transaction(120)],
      recurringCharges: [],
      rollingBudgets: [budget],
      startMonth: '2024-01',
      months: 1,
    });

    expect(projection[0].rollingBudgets?.[0].status).toBe('EXCEEDED');
  });

  it('aggregates correctly across windows', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 1000,
      transactions: [
        { ...transaction(60), date: '2024-01-05' },
        { ...transaction(60), date: '2024-02-05' },
      ],
      recurringCharges: [],
      rollingBudgets: [budget],
      startMonth: '2024-01',
      months: 2,
    });

    expect(projection[1].rollingBudgets?.[0].totalSpent).toBe(120);
  });

  it('keeps categories independent', () => {
    const utilitiesBudget = { category: 'utilities', amount: 200, windowMonths: 2 };
    const transactions = [
      transaction(80, 'groceries'),
      transaction(160, 'utilities'),
    ];

    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 1000,
      transactions,
      recurringCharges: [],
      rollingBudgets: [budget, utilitiesBudget],
      startMonth: '2024-01',
      months: 1,
    });

    const statuses = projection[0].rollingBudgets?.reduce<Record<string, string>>((acc, entry) => {
      acc[entry.category] = entry.status;
      return acc;
    }, {});

    expect(statuses?.groceries).toBe('WARNING');
    expect(statuses?.utilities).toBe('WARNING');
  });

  it('is deterministic across runs', () => {
    const input = {
      account: 'SG',
      initialBalance: 1000,
      transactions: [transaction(50)],
      recurringCharges: [],
      rollingBudgets: [budget],
      startMonth: '2024-01',
      months: 1,
    };

    const first = calculateProjection(input);
    const second = calculateProjection(input);
    expect(first).toEqual(second);
  });
});
