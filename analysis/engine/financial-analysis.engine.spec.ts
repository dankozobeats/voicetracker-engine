import { describe, expect, it } from 'vitest';
import {
  analyzeFinancialData,
  type SupabaseTransaction,
} from './financial-analysis.engine';

describe('analyzeFinancialData', () => {
  it('returns correct summary for income transactions', () => {
    const transactions: SupabaseTransaction[] = [
      {
        id: '1',
        user_id: 'user-1',
        date: '2024-03-15',
        label: 'Revenu',
        amount: 3000,
        category: 'Salaire',
      },
      {
        id: '2',
        user_id: 'user-1',
        date: '2024-03-20',
        label: 'Revenu bonus',
        amount: 500,
        category: 'Bonus',
      },
    ];

    const result = analyzeFinancialData(transactions);

    expect(result.summary.income).toBe(3500);
    expect(result.summary.expenses).toBe(0);
    expect(result.summary.net).toBe(3500);
    expect(result.summary.openingBalance).toBe(0);
  });

  it('returns correct summary for expense transactions', () => {
    const transactions: SupabaseTransaction[] = [
      {
        id: '1',
        user_id: 'user-1',
        date: '2024-03-15',
        label: 'Dépense',
        amount: -500,
        category: 'Alimentation',
      },
      {
        id: '2',
        user_id: 'user-1',
        date: '2024-03-20',
        label: 'Dépense',
        amount: -200,
        category: 'Transport',
      },
    ];

    const result = analyzeFinancialData(transactions);

    expect(result.summary.income).toBe(0);
    expect(result.summary.expenses).toBe(700);
    expect(result.summary.net).toBe(-700);
  });

  it('returns correct summary for mixed transactions', () => {
    const transactions: SupabaseTransaction[] = [
      {
        id: '1',
        user_id: 'user-1',
        date: '2024-03-15',
        label: 'Revenu',
        amount: 3000,
        category: 'Salaire',
      },
      {
        id: '2',
        user_id: 'user-1',
        date: '2024-03-20',
        label: 'Dépense',
        amount: -500,
        category: 'Alimentation',
      },
    ];

    const result = analyzeFinancialData(transactions);

    expect(result.summary.income).toBe(3000);
    expect(result.summary.expenses).toBe(500);
    expect(result.summary.net).toBe(2500);
  });

  it('generates NEGATIVE_NET alert when net is negative', () => {
    const transactions: SupabaseTransaction[] = [
      {
        id: '1',
        user_id: 'user-1',
        date: '2024-03-15',
        label: 'Revenu',
        amount: 1000,
        category: 'Salaire',
      },
      {
        id: '2',
        user_id: 'user-1',
        date: '2024-03-20',
        label: 'Dépense',
        amount: -1500,
        category: 'Alimentation',
      },
    ];

    const result = analyzeFinancialData(transactions);

    const negativeNetAlert = result.alerts.find((a) => a.type === 'NEGATIVE_NET');
    expect(negativeNetAlert).toBeDefined();
    expect(negativeNetAlert?.severity).toBe('CRITICAL');
  });

  it('generates HIGH_EXPENSE alert for expenses above threshold', () => {
    const transactions: SupabaseTransaction[] = [
      {
        id: '1',
        user_id: 'user-1',
        date: '2024-03-15',
        label: 'Dépense',
        amount: -1200,
        category: 'Loyer',
      },
    ];

    const result = analyzeFinancialData(transactions);

    const highExpenseAlert = result.alerts.find((a) => a.type === 'HIGH_EXPENSE');
    expect(highExpenseAlert).toBeDefined();
    expect(highExpenseAlert?.severity).toBe('WARNING');
    expect(highExpenseAlert?.amount).toBe(1200);
  });

  it('generates both alerts when applicable', () => {
    const transactions: SupabaseTransaction[] = [
      {
        id: '1',
        user_id: 'user-1',
        date: '2024-03-15',
        label: 'Dépense',
        amount: -1200,
        category: 'Loyer',
      },
      {
        id: '2',
        user_id: 'user-1',
        date: '2024-03-20',
        label: 'Dépense',
        amount: -500,
        category: 'Autre',
      },
    ];

    const result = analyzeFinancialData(transactions);

    expect(result.alerts.length).toBeGreaterThanOrEqual(1);
    expect(result.alerts.some((a) => a.type === 'NEGATIVE_NET')).toBe(true);
    expect(result.alerts.some((a) => a.type === 'HIGH_EXPENSE')).toBe(true);
  });

  it('calculates trends by category', () => {
    const transactions: SupabaseTransaction[] = [
      {
        id: '1',
        user_id: 'user-1',
        date: '2024-03-15',
        label: 'Dépense',
        amount: -500,
        category: 'Alimentation',
      },
      {
        id: '2',
        user_id: 'user-1',
        date: '2024-03-20',
        label: 'Dépense',
        amount: -300,
        category: 'Transport',
      },
    ];

    const result = analyzeFinancialData(transactions);

    expect(result.trends.length).toBe(2);
    expect(result.trends.map((t) => t.category)).toContain('Alimentation');
    expect(result.trends.map((t) => t.category)).toContain('Transport');
  });

  it('handles transactions without category', () => {
    const transactions: SupabaseTransaction[] = [
      {
        id: '1',
        user_id: 'user-1',
        date: '2024-03-15',
        label: 'Dépense',
        amount: -500,
        category: null,
      },
    ];

    const result = analyzeFinancialData(transactions);

    expect(result.trends.length).toBe(1);
    expect(result.trends[0].category).toBe('Non catégorisé');
  });

  it('does not mutate input transactions', () => {
    const transactions: SupabaseTransaction[] = [
      {
        id: '1',
        user_id: 'user-1',
        date: '2024-03-15',
        label: 'Dépense',
        amount: -500,
        category: 'Alimentation',
      },
    ];

    const originalTransactions = JSON.parse(JSON.stringify(transactions));
    analyzeFinancialData(transactions);

    expect(transactions).toEqual(originalTransactions);
  });

  it('is deterministic: same input produces same output', () => {
    const transactions: SupabaseTransaction[] = [
      {
        id: '1',
        user_id: 'user-1',
        date: '2024-03-15',
        label: 'Revenu',
        amount: 3000,
        category: 'Salaire',
      },
    ];

    const result1 = analyzeFinancialData(transactions);
    const result2 = analyzeFinancialData(transactions);

    expect(result1).toEqual(result2);
  });

  it('handles empty transactions array', () => {
    const transactions: SupabaseTransaction[] = [];

    const result = analyzeFinancialData(transactions);

    expect(result.summary.income).toBe(0);
    expect(result.summary.expenses).toBe(0);
    expect(result.summary.net).toBe(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.trends).toHaveLength(0);
  });
});

