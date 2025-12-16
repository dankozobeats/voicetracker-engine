import { describe, it, expect } from 'vitest';

import { calculateProjection } from './calculator';
import type { CeilingRule, RecurringCharge } from './types';

const ceilingRule: CeilingRule = {
  id: 'monthly-spend-limit',
  account: 'SG',
  amount: 1000,
  startMonth: '2024-01',
};

const buildRecurringCharges = (fixedCharge: number): RecurringCharge[] =>
  fixedCharge > 0
    ? [
        {
          id: 'monthly-fixed',
          account: 'SG',
          amount: fixedCharge,
          startMonth: '2024-01',
        },
      ]
    : [];

const buildInput = (expenses: number, fixedCharge: number) => ({
  account: 'SG',
  initialBalance: 0,
  transactions: [
    {
      id: `expense-${expenses}`,
      account: 'SG',
      type: 'EXPENSE',
      amount: -expenses,
      date: '2024-01-10',
    },
  ],
  recurringCharges: buildRecurringCharges(fixedCharge),
  ceilingRules: [ceilingRule],
  startMonth: '2024-01',
  months: 1,
});

describe('ceiling evaluation', () => {
  it('records NOT_REACHED when total outflow stays below the ceiling', () => {
    const projection = calculateProjection(buildInput(400, 100));
    expect(projection[0].ceilings).toHaveLength(1);
    expect(projection[0].ceilings[0].state).toBe('NOT_REACHED');
  });

  it('records REACHED when total outflow matches the ceiling', () => {
    const projection = calculateProjection(buildInput(500, 500));
    expect(projection[0].ceilings).toHaveLength(1);
    expect(projection[0].ceilings[0].state).toBe('REACHED');
  });

  it('records EXCEEDED when total outflow surpasses the ceiling', () => {
    const projection = calculateProjection(buildInput(800, 500));
    expect(projection[0].ceilings).toHaveLength(1);
    expect(projection[0].ceilings[0].state).toBe('EXCEEDED');
  });
});
