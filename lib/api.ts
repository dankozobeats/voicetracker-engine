import type { EnginePayload, MonthlySummaryOutput } from './types';
import { monthlySummaryConsumer, type MonthlySummaryInput } from '@/analysis/consumers/monthly-summary.consumer';
import { fetchAnalysisPayload } from './api-client';
import type { AdvancedAlert } from 'engine/types';

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
          fixedCharges: 0,
          variableSpent: 680,
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
          currentFixedCharges: 500,
          previousFixedCharges: 500,
          currentVariableSpent: 180,
          previousVariableSpent: 110,
          delta: 70,
          percentChange: 11.47,
          trend: 'INCREASING',
        },
        {
          category: 'Transport',
          current: 210,
          previous: 205,
          currentFixedCharges: 150,
          previousFixedCharges: 150,
          currentVariableSpent: 60,
          previousVariableSpent: 55,
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
      fixedCharges: 0,
      variableSpent: 680,
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
      currentFixedCharges: 500,
      previousFixedCharges: 500,
      currentVariableSpent: 180,
      previousVariableSpent: 110,
      delta: 70,
      percentChange: 11.47,
      trend: 'INCREASING',
    },
    {
      category: 'Transport',
      current: 210,
      previous: 205,
      currentFixedCharges: 150,
      previousFixedCharges: 150,
      currentVariableSpent: 60,
      previousVariableSpent: 55,
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

const mockedAdvancedAlerts: AdvancedAlert[] = [
  {
    month: '2024-03',
    domain: 'BUDGET',
    category: 'Alimentation',
    ruleId: 'BUDGET:ALIMENTATION:2024-03',
    groupId: 'BUDGET:Alimentation',
    severity: 'CRITICAL',
    metadata: {
      spent: 680,
      budget: 600,
    },
    priorityRank: 1,
  },
  {
    month: '2024-03',
    domain: 'TREND',
    category: 'Alimentation',
    ruleId: 'TREND:ALIMENTATION:2024-03',
    groupId: 'TREND:Alimentation',
    severity: 'WARNING',
    metadata: {
      delta: 70,
    },
    priorityRank: 2,
  },
];

const monthlySummaryInput: MonthlySummaryInput = {
  month: mockedEnginePayload.months[0].month,
  alerts: mockedAdvancedAlerts,
  trends: mockedEnginePayload.trends,
};

export const mockedMonthlySummary: MonthlySummaryOutput = monthlySummaryConsumer(monthlySummaryInput);

const mockedAnalysisData = {
  payload: mockedEnginePayload,
  monthlySummary: mockedMonthlySummary,
};

const useRealApi = ['1', 'true'].includes(String(process.env.NEXT_PUBLIC_USE_REAL_API || '').toLowerCase());
const engineApiUrl = process.env.NEXT_PUBLIC_ENGINE_API_URL;
const timeoutMs = Number(process.env.NEXT_PUBLIC_ENGINE_API_TIMEOUT_MS ?? '') || undefined;
const failHard = ['1', 'true'].includes(String(process.env.NEXT_PUBLIC_ENGINE_API_FAIL_HARD || '').toLowerCase());

const normalizePayload = (payload: EnginePayload): EnginePayload => ({
  ...payload,
  months: payload.months ?? [],
  balances: payload.balances ?? [],
  categoryBudgets: payload.categoryBudgets ?? [],
  rollingBudgets: payload.rollingBudgets ?? [],
  multiMonthBudgets: payload.multiMonthBudgets ?? [],
  trends: payload.trends ?? [],
  alertTexts: payload.alertTexts ?? [],
});

const buildMonthlySummary = (payload: EnginePayload): MonthlySummaryOutput => {
  const month = payload.months[0]?.month ?? '0000-00';

  return monthlySummaryConsumer({
    month,
    alerts: mockedAdvancedAlerts,
    trends: payload.trends ?? [],
  });
};

export async function getAnalysisData() {
  if (!useRealApi) {
    return mockedAnalysisData;
  }

  if (!engineApiUrl) {
    throw new Error('NEXT_PUBLIC_ENGINE_API_URL must be defined when NEXT_PUBLIC_USE_REAL_API is enabled');
  }

  try {
    const payload = normalizePayload(
      await fetchAnalysisPayload(engineApiUrl, {
        timeoutMs,
      })
    );

    return {
      payload,
      monthlySummary: buildMonthlySummary(payload),
    };
  } catch (error) {
    if (failHard) {
      throw error;
    }

    console.warn('Falling back to mocked engine data after API failure', error);

    return mockedAnalysisData;
  }
}
