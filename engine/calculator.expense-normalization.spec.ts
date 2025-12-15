import { describe, it, expect } from 'vitest';
import { normalizeExpenseAmount } from './calculator';

describe('normalizeExpenseAmount', () => {
  it('always returns a positive cost', () => {
    expect(normalizeExpenseAmount(-1000)).toBe(1000);
    expect(normalizeExpenseAmount(1000)).toBe(1000);

    const expenses = [-1000, 500, -200];
    const normalizedTotal = expenses
      .map((amount) => normalizeExpenseAmount(amount))
      .reduce((total, amount) => total + amount, 0);

    expect(normalizedTotal).toBe(1700);
  });
});
