import { describe, it, expect } from 'vitest';

import { calculateProjection } from './calculator';

const budget = { category: 'groceries', budget: 100 };
const buildTransaction = (amount: number) => ({
  id: `txn-${amount}`,
  account: 'SG' as const,
  type: 'EXPENSE' as const,
  amount: -amount,
  date: '2024-01-10',
  category: 'groceries',
});

describe('category budgets', () => {
  it('reports OK when spending stays below the budget', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [buildTransaction(50)],
      recurringCharges: [],
      categoryBudgets: [budget],
      startMonth: '2024-01',
      months: 1,
    });

    expect(projection[0].categoryBudgets[0].status).toBe('OK');
  });

  it('reports WARNING when spending hits 80% of the budget', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [buildTransaction(80)],
      recurringCharges: [],
      categoryBudgets: [budget],
      startMonth: '2024-01',
      months: 1,
    });

    expect(projection[0].categoryBudgets[0].status).toBe('WARNING');
  });

  it('reports EXCEEDED when spending surpasses the budget', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [buildTransaction(120)],
      recurringCharges: [],
      categoryBudgets: [budget],
      startMonth: '2024-01',
      months: 1,
    });

    expect(projection[0].categoryBudgets[0].status).toBe('EXCEEDED');
  });

  it('reports WARNING when spending matches 100% of the budget', () => {
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [buildTransaction(100)],
      recurringCharges: [],
      categoryBudgets: [budget],
      startMonth: '2024-01',
      months: 1,
    });

    expect(projection[0].categoryBudgets[0].status).toBe('WARNING');
  });

  it('handles multiple categories independently', () => {
    const groceries = { category: 'groceries', budget: 100 };
    const utilities = { category: 'utilities', budget: 200 };

    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [
        buildTransaction(90),
        {
          id: 'txn-utils',
          account: 'SG',
          type: 'EXPENSE',
          amount: -150,
          date: '2024-01-05',
          category: 'utilities',
        },
      ],
      recurringCharges: [],
      categoryBudgets: [groceries, utilities],
      startMonth: '2024-01',
      months: 1,
    });

    const results = projection[0].categoryBudgets.reduce<Record<string, string>>((acc, entry) => {
      acc[entry.category] = entry.status;
      return acc;
    }, {});

    expect(results.groceries).toBe('WARNING');
    expect(results.utilities).toBe('OK');
  });

  it('remains deterministic across runs', () => {
    const input = {
      account: 'SG',
      initialBalance: 0,
      transactions: [buildTransaction(30)],
      recurringCharges: [],
      categoryBudgets: [budget],
      startMonth: '2024-01',
      months: 1,
    };

    const first = calculateProjection(input);
    const second = calculateProjection(input);
    expect(first).toEqual(second);
  });
});
