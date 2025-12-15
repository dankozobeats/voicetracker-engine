import { describe, it, expect } from 'vitest';

import { calculateProjection } from './calculator';
import { sampleRecurringCharges, sampleTransactions } from './fixtures';

describe('calculateProjection', () => {
  it('3-month SG projection includes fixed charges and deferred handling', () => {
    // Valide que les charges fixes et les différés restent constants sur trois mois.
    const projection = calculateProjection({
      account: 'SG',
      initialBalance: 0,
      transactions: sampleTransactions,
      recurringCharges: sampleRecurringCharges,
      startMonth: '2024-01',
      months: 3,
    });

    expect(projection).toHaveLength(3);

    projection.forEach((monthResult) => {
      expect(monthResult.fixedCharges).toBe(850);
    });

    expect(projection[1].deferredIn).toBe(120);
  });
});
