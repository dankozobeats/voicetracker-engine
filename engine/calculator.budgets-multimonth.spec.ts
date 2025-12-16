import { describe, expect, it } from 'vitest';
import { calculateProjection } from './calculator';

describe('Budgets multi-mois', () => {
  const baseInput = {
    account: 'SG',
    initialBalance: 0,
    startMonth: '2024-01',
    months: 4,
    transactions: [
      { id: 't1', account: 'SG', type: 'EXPENSE', amount: -50, date: '2024-01-05', category: 'food' },
      { id: 't2', account: 'SG', type: 'EXPENSE', amount: -150, date: '2024-02-02', category: 'food' },
      { id: 't3', account: 'SG', type: 'EXPENSE', amount: -50, date: '2024-02-10', category: 'food' },
      { id: 't4', account: 'SG', type: 'EXPENSE', amount: -100, date: '2024-03-01', category: 'food' },
      { id: 't5', account: 'SG', type: 'EXPENSE', amount: -100, date: '2024-02-15', category: 'transport' },
      { id: 't6', account: 'SG', type: 'EXPENSE', amount: -150, date: '2024-03-20', category: 'transport' },
      { id: 't7', account: 'SG', type: 'EXPENSE', amount: -50, date: '2024-01-12', category: 'rent' },
      { id: 't8', account: 'SG', type: 'EXPENSE', amount: -100, date: '2024-02-11', category: 'rent' },
    ],
    recurringCharges: [],
    categoryBudgets: [],
    rollingBudgets: [],
    multiMonthBudgets: [
      { category: 'food', amount: 300, periodStart: '2024-01', periodEnd: '2024-03' },
      { category: 'transport', amount: 200, periodStart: '2024-02', periodEnd: '2024-03' },
      { category: 'rent', amount: 150, periodStart: '2024-01', periodEnd: '2024-02' },
    ],
  };

  it('applique les seuils OK / WARNING / REACHED / EXCEEDED sur la fenêtre définie', () => {
    const projection = calculateProjection(baseInput);
    const month = (label: string) => projection.find((entry) => entry.month === label)!;
    const findBudget = (monthLabel: string, category: string) =>
      month(monthLabel).multiMonthBudgets?.find((budget) => budget.category === category);

    expect(findBudget('2024-01', 'food')?.status).toBe('OK');
    expect(findBudget('2024-02', 'food')?.status).toBe('WARNING');
    expect(findBudget('2024-03', 'food')?.status).toBe('EXCEEDED');

    expect(findBudget('2024-02', 'rent')?.status).toBe('REACHED');
    expect(findBudget('2024-02', 'transport')?.status).toBe('OK');
    expect(findBudget('2024-03', 'transport')?.status).toBe('EXCEEDED');

    expect(findBudget('2024-04', 'food')?.status).toBe('INACTIVE');
  });

  it('agrège les dépenses jusqu’au mois courant sans modifier les soldes', () => {
    const projection = calculateProjection(baseInput);
    const marchBudget = projection
      .find((entry) => entry.month === '2024-03')
      ?.multiMonthBudgets?.find((budget) => budget.category === 'transport');

    expect(marchBudget?.totalSpent).toBe(250);
    expect(marchBudget?.ratio).toBeGreaterThan(1);
  });

  it('reste déterministe à chaque appel', () => {
    const firstRun = calculateProjection(baseInput);
    const secondRun = calculateProjection(baseInput);
    expect(firstRun).toEqual(secondRun);
  });
});
