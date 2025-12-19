import type { EnginePayload } from './types';

export const mockedEnginePayload: EnginePayload = {
  months: [
    {
      month: '2024-03',
      openingBalance: 1500,
      income: 3000,
      expenses: 2450,
      fixedCharges: 850,
      deferredIn: 120,
      carriedOverDeficit: 0,
      endingBalance: 2070,
      ceilings: [
        {
          ruleId: 'CEILING:SG:2024-03',
          month: '2024-03',
          ceiling: 4000,
          totalOutflow: 2470,
          state: 'NOT_REACHED',
        },
      ],
      deferredResolutions: [
        {
          transactionId: 'tx-123',
          month: '2024-03',
          amount: 120,
          status: 'APPLIED',
          priority: 1,
          forced: false,
          category: 'Abonnements',
        },
      ],
      categoryBudgets: [
        {
          category: 'Alimentation',
          budget: 600,
          spent: 680,
          remaining: -80,
          status: 'EXCEEDED',
        },
      ],
      categorySpending: {
        Alimentation: 680,
        Transport: 210,
      },
      multiMonthBudgets: [
        {
          category: 'Projets',
          periodStart: '2024-01',
          periodEnd: '2024-06',
          totalSpent: 2400,
          budgetAmount: 3000,
          ratio: 80,
          status: 'WARNING',
        },
        {
          category: 'Infrastructures',
          periodStart: '2024-01',
          periodEnd: '2024-12',
          totalSpent: 1800,
          budgetAmount: 2500,
          ratio: 72,
          status: 'OK',
        },
      ],
      rollingBudgets: [
        {
          category: 'Alimentation',
          windowMonths: 3,
          totalSpent: 1800,
          budgetAmount: 2000,
          ratio: 90,
          status: 'WARNING',
        },
        {
          category: 'Transport',
          windowMonths: 3,
          totalSpent: 450,
          budgetAmount: 600,
          ratio: 75,
          status: 'OK',
        },
      ],
      trends: [
        {
          category: 'Alimentation',
          current: 680,
          previous: 610,
          delta: 70,
          percentChange: 11.47,
          trend: 'INCREASING',
        },
        {
          category: 'Transport',
          current: 210,
          previous: 205,
          delta: 5,
          percentChange: 2.44,
          trend: 'STABLE',
        },
      ],
    },
  ],
  balances: [
    { account: 'SG', amount: 2070 },
    { account: 'FLOA', amount: 900 },
  ],
  categoryBudgets: [
    {
      category: 'Alimentation',
      budget: 600,
      spent: 680,
      remaining: -80,
      status: 'EXCEEDED',
    },
  ],
  rollingBudgets: [
    {
      category: 'Alimentation',
      windowMonths: 3,
      totalSpent: 1800,
      budgetAmount: 2000,
      ratio: 90,
      status: 'WARNING',
    },
    {
      category: 'Transport',
      windowMonths: 3,
      totalSpent: 450,
      budgetAmount: 600,
      ratio: 75,
      status: 'OK',
    },
  ],
  multiMonthBudgets: [
    {
      category: 'Projets',
      periodStart: '2024-01',
      periodEnd: '2024-06',
      totalSpent: 2400,
      budgetAmount: 3000,
      ratio: 80,
      status: 'WARNING',
    },
    {
      category: 'Infrastructures',
      periodStart: '2024-01',
      periodEnd: '2024-12',
      totalSpent: 1800,
      budgetAmount: 2500,
      ratio: 72,
      status: 'OK',
    },
  ],
  trends: [
    {
      category: 'Alimentation',
      current: 680,
      previous: 610,
      delta: 70,
      percentChange: 11.47,
      trend: 'INCREASING',
    },
    {
      category: 'Transport',
      current: 210,
      previous: 205,
      delta: 5,
      percentChange: 2.44,
      trend: 'STABLE',
    },
  ],
  alertTexts: [
    {
      groupId: 'BUDGET:Alimentation',
      severity: 'CRITICAL',
      title: 'Budget — Alimentation',
      message:
        'Ton : action requise / dépassement · Domaine : Budget · Catégorie : Alimentation · Règle : BUDGET:ALIMENTATION:2024-03 · Groupe : BUDGET:Alimentation',
      priorityRank: 1,
    },
    {
      groupId: 'TREND:Alimentation',
      severity: 'WARNING',
      title: 'Tendance — Alimentation',
      message:
        'Ton : attention / seuil approché · Domaine : Tendance · Catégorie : Alimentation · Règle : TREND:ALIMENTATION:2024-03 · Groupe : TREND:Alimentation',
      priorityRank: 2,
    },
  ],
};
