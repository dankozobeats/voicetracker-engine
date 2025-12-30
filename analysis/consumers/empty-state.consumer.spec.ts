import { describe, expect, it } from 'vitest';
import { emptyStateConsumer, type EmptyStateInput } from './empty-state.consumer';

describe('emptyStateConsumer', () => {
  it('returns isEmpty=true when no transactions exist', () => {
    const input: EmptyStateInput = {
      transactions: [],
    };

    const output = emptyStateConsumer(input);

    expect(output.isEmpty).toBe(true);
    expect(output.emptyReason).toBe('NO_TRANSACTIONS');
  });

  it('returns isEmpty=true when transactions array is empty', () => {
    const input: EmptyStateInput = {
      transactions: [],
      budgets: [],
      recurringCharges: [],
    };

    const output = emptyStateConsumer(input);

    expect(output.isEmpty).toBe(true);
    expect(output.emptyReason).toBe('NO_TRANSACTIONS');
  });

  it('returns isEmpty=false when transactions exist', () => {
    const input: EmptyStateInput = {
      transactions: [{ id: '1', amount: 100 }],
    };

    const output = emptyStateConsumer(input);

    expect(output.isEmpty).toBe(false);
    expect(output.emptyReason).toBeUndefined();
  });

  it('returns isEmpty=false when transactions exist even without budgets', () => {
    const input: EmptyStateInput = {
      transactions: [{ id: '1', amount: 100 }],
      budgets: [],
      recurringCharges: [],
    };

    const output = emptyStateConsumer(input);

    expect(output.isEmpty).toBe(false);
    expect(output.emptyReason).toBeUndefined();
  });

  it('does not mutate input data', () => {
    const transactions = [{ id: '1', amount: 100 }];
    const input: EmptyStateInput = {
      transactions,
    };

    const originalTransactions = JSON.parse(JSON.stringify(transactions));
    emptyStateConsumer(input);

    expect(transactions).toEqual(originalTransactions);
  });

  it('is deterministic: same input produces same output', () => {
    const input: EmptyStateInput = {
      transactions: [],
    };

    const output1 = emptyStateConsumer(input);
    const output2 = emptyStateConsumer(input);

    expect(output1).toEqual(output2);
  });
});


