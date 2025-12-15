import { describe, it, expect } from 'vitest';
import { calculateProjection } from './calculator';

describe('deficit handling', () => {
  it('deficit is carried to next month', () => {
    // Vérifie que le découvert de janvier se reporte sur février.
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: [
        {
        amount: -1000,
        date: '2024-01-10',
        type: 'EXPENSE',
        account: 'SG',
        },
        {
        amount: 600,
        date: '2024-02-05',
        type: 'INCOME',
        account: 'SG',
        },
      ],
      recurringCharges: [],
      startMonth: '2024-01',
      months: 2,
    });

    expect(projection[0].endingBalance).toBe(-1000);

    expect(projection[1].carriedOverDeficit).toBe(1000);
    expect(projection[1].endingBalance).toBe(-1400);
  });
});
