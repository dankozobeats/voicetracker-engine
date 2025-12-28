import { describe, it, expect } from 'vitest';
import { calculateProjection } from './calculator';
import type { ProjectionInput, RecurringCharge } from './types';

describe('Calculator - Cumulative Monthly Overrides', () => {
  it('should use base amount when no overrides are defined', () => {
    const charge: RecurringCharge = {
      id: 'test-1',
      account: 'SG',
      type: 'EXPENSE',
      amount: 1000,
      startMonth: '2025-01',
      endMonth: '2025-12',
    };

    const input: ProjectionInput = {
      account: 'SG',
      initialBalance: 5000,
      transactions: [],
      recurringCharges: [charge],
      startMonth: '2025-01',
      months: 6,
    };

    const result = calculateProjection(input);

    // All months should use base amount of 1000
    expect(result[0].fixedCharges).toBe(1000); // Jan
    expect(result[1].fixedCharges).toBe(1000); // Feb
    expect(result[2].fixedCharges).toBe(1000); // Mar
    expect(result[3].fixedCharges).toBe(1000); // Apr
    expect(result[4].fixedCharges).toBe(1000); // May
    expect(result[5].fixedCharges).toBe(1000); // Jun
  });

  it('should use exact override when month matches exactly', () => {
    const charge: RecurringCharge = {
      id: 'test-2',
      account: 'SG',
      type: 'EXPENSE',
      amount: 1000,
      startMonth: '2025-01',
      endMonth: '2025-12',
      monthlyOverrides: {
        '2025-03': 1200,
      },
    };

    const input: ProjectionInput = {
      account: 'SG',
      initialBalance: 5000,
      transactions: [],
      recurringCharges: [charge],
      startMonth: '2025-01',
      months: 6,
    };

    const result = calculateProjection(input);

    expect(result[0].fixedCharges).toBe(1000); // Jan - base
    expect(result[1].fixedCharges).toBe(1000); // Feb - base
    expect(result[2].fixedCharges).toBe(1200); // Mar - exact override
    expect(result[3].fixedCharges).toBe(1200); // Apr - carries forward
    expect(result[4].fixedCharges).toBe(1200); // May - carries forward
    expect(result[5].fixedCharges).toBe(1200); // Jun - carries forward
  });

  it('should carry forward the last override chronologically', () => {
    const charge: RecurringCharge = {
      id: 'test-3',
      account: 'SG',
      type: 'EXPENSE',
      amount: 1000,
      startMonth: '2025-01',
      endMonth: '2025-12',
      monthlyOverrides: {
        '2025-03': 1200,
        '2025-06': 1500,
      },
    };

    const input: ProjectionInput = {
      account: 'SG',
      initialBalance: 10000,
      transactions: [],
      recurringCharges: [charge],
      startMonth: '2025-01',
      months: 12,
    };

    const result = calculateProjection(input);

    // Base amount before first override
    expect(result[0].fixedCharges).toBe(1000); // Jan
    expect(result[1].fixedCharges).toBe(1000); // Feb

    // First override and carry forward
    expect(result[2].fixedCharges).toBe(1200); // Mar - exact
    expect(result[3].fixedCharges).toBe(1200); // Apr - carry
    expect(result[4].fixedCharges).toBe(1200); // May - carry

    // Second override and carry forward
    expect(result[5].fixedCharges).toBe(1500); // Jun - exact
    expect(result[6].fixedCharges).toBe(1500); // Jul - carry
    expect(result[7].fixedCharges).toBe(1500); // Aug - carry
    expect(result[8].fixedCharges).toBe(1500); // Sep - carry
    expect(result[9].fixedCharges).toBe(1500); // Oct - carry
    expect(result[10].fixedCharges).toBe(1500); // Nov - carry
    expect(result[11].fixedCharges).toBe(1500); // Dec - carry
  });

  it('should handle overrides before projection start month', () => {
    const charge: RecurringCharge = {
      id: 'test-4',
      account: 'SG',
      type: 'EXPENSE',
      amount: 1000,
      startMonth: '2025-01',
      endMonth: '2025-12',
      monthlyOverrides: {
        '2025-02': 1100,
        '2025-04': 1300,
      },
    };

    const input: ProjectionInput = {
      account: 'SG',
      initialBalance: 10000,
      transactions: [],
      recurringCharges: [charge],
      startMonth: '2025-05', // Start AFTER some overrides
      months: 4,
    };

    const result = calculateProjection(input);

    // Should use the last override before start month (2025-04 = 1300)
    expect(result[0].fixedCharges).toBe(1300); // May - uses Apr override
    expect(result[1].fixedCharges).toBe(1300); // Jun - carries forward
    expect(result[2].fixedCharges).toBe(1300); // Jul - carries forward
    expect(result[3].fixedCharges).toBe(1300); // Aug - carries forward
  });

  it('should work with INCOME type recurring charges', () => {
    const charge: RecurringCharge = {
      id: 'salary',
      account: 'SG',
      type: 'INCOME',
      amount: 2000,
      startMonth: '2025-01',
      endMonth: '2025-12',
      monthlyOverrides: {
        '2025-04': 2500, // Raise in April
      },
    };

    const input: ProjectionInput = {
      account: 'SG',
      initialBalance: 1000,
      transactions: [],
      recurringCharges: [charge],
      startMonth: '2025-01',
      months: 6,
    };

    const result = calculateProjection(input);

    // Base salary
    expect(result[0].income).toBe(2000); // Jan
    expect(result[1].income).toBe(2000); // Feb
    expect(result[2].income).toBe(2000); // Mar

    // Raise and carry forward
    expect(result[3].income).toBe(2500); // Apr - raise
    expect(result[4].income).toBe(2500); // May - carries
    expect(result[5].income).toBe(2500); // Jun - carries
  });

  it('should handle multiple overrides in non-chronological order', () => {
    const charge: RecurringCharge = {
      id: 'test-5',
      account: 'SG',
      type: 'EXPENSE',
      amount: 100,
      startMonth: '2025-01',
      endMonth: '2025-12',
      monthlyOverrides: {
        '2025-06': 300,
        '2025-02': 200,
        '2025-10': 400,
      },
    };

    const input: ProjectionInput = {
      account: 'SG',
      initialBalance: 10000,
      transactions: [],
      recurringCharges: [charge],
      startMonth: '2025-01',
      months: 12,
    };

    const result = calculateProjection(input);

    expect(result[0].fixedCharges).toBe(100); // Jan - base
    expect(result[1].fixedCharges).toBe(200); // Feb - first override
    expect(result[2].fixedCharges).toBe(200); // Mar - carry
    expect(result[3].fixedCharges).toBe(200); // Apr - carry
    expect(result[4].fixedCharges).toBe(200); // May - carry
    expect(result[5].fixedCharges).toBe(300); // Jun - second override
    expect(result[6].fixedCharges).toBe(300); // Jul - carry
    expect(result[7].fixedCharges).toBe(300); // Aug - carry
    expect(result[8].fixedCharges).toBe(300); // Sep - carry
    expect(result[9].fixedCharges).toBe(400); // Oct - third override
    expect(result[10].fixedCharges).toBe(400); // Nov - carry
    expect(result[11].fixedCharges).toBe(400); // Dec - carry
  });
});
