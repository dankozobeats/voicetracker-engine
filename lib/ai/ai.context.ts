import type { AiContext, AiContextMeta, AiContextWindow } from './ai.types';

interface AiContextRequest {
  nextUrl: {
    origin: string;
  };
}

interface BuildAiContextOptions {
  request: AiContextRequest;
  cookies: string;
  windowMonths: AiContextWindow;
}

const MAX_TRANSACTIONS = 300;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toMonthKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
};

const buildMonthWindow = (months: number): string[] => {
  const now = new Date();
  const window: string[] = [];
  for (let index = 0; index < months; index += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    window.push(toMonthKey(date));
  }
  return window;
};

export async function buildAiContext({ request, cookies, windowMonths }: BuildAiContextOptions): Promise<AiContext> {
  const meta: AiContextMeta = {
    errors: [],
    limits: [],
  };

  const baseUrl = request?.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  if (!request?.nextUrl?.origin) {
    meta.errors.push('Missing request origin; using fallback base URL');
  }

  const cookieHeader = cookies ?? '';

  const fetchJson = async (path: string): Promise<unknown | null> => {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          cookie: cookieHeader,
        },
      });

      const text = await response.text();

      if (!response.ok) {
        meta.errors.push(`GET ${path} failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
        return null;
      }

      try {
        return JSON.parse(text) as unknown;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        meta.errors.push(`GET ${path} invalid JSON response: ${message}`);
        return null;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      meta.errors.push(`GET ${path} error: ${message}`);
      return null;
    }
  };

  const effectiveWindow = windowMonths;
  const transactionWindow = Math.min(effectiveWindow, 6);
  if (effectiveWindow > 6) {
    meta.limits.push('transactions limited to last 6 months');
  }

  const transactionMonths = buildMonthWindow(transactionWindow);
  const transactions: unknown[] = [];

  for (const month of transactionMonths) {
    const data = await fetchJson(`/api/transactions?month=${encodeURIComponent(month)}`);
    if (!data) {
      continue;
    }
    if (isRecord(data) && Array.isArray(data.transactions)) {
      transactions.push(...data.transactions);
    } else {
      meta.errors.push(`Unexpected transactions response for month ${month}`);
    }
  }

  if (transactions.length > MAX_TRANSACTIONS) {
    meta.limits.push(`transactions truncated to ${MAX_TRANSACTIONS} items`);
    transactions.splice(MAX_TRANSACTIONS);
  }

  const recurringChargesData = await fetchJson('/api/recurring-charges');
  const recurringCharges = isRecord(recurringChargesData) && Array.isArray(recurringChargesData.recurringCharges)
    ? recurringChargesData.recurringCharges
    : [];
  if (recurringChargesData && !(isRecord(recurringChargesData) && 'recurringCharges' in recurringChargesData)) {
    meta.errors.push('Unexpected recurring-charges response');
  }

  const ceilingRulesData = await fetchJson('/api/ceiling-rules');
  const ceilingRules = isRecord(ceilingRulesData) && Array.isArray(ceilingRulesData.ceilingRules)
    ? ceilingRulesData.ceilingRules
    : [];
  if (ceilingRulesData && !(isRecord(ceilingRulesData) && 'ceilingRules' in ceilingRulesData)) {
    meta.errors.push('Unexpected ceiling-rules response');
  }

  const budgets = await fetchJson('/api/budgets');
  if (!budgets) {
    meta.errors.push('Missing budgets response');
  }

  const debtsData = await fetchJson('/api/debts');
  const debts = isRecord(debtsData) && Array.isArray(debtsData.debts) ? debtsData.debts : [];
  if (debtsData && !(isRecord(debtsData) && 'debts' in debtsData)) {
    meta.errors.push('Unexpected debts response');
  }

  const creditsData = await fetchJson('/api/credits');
  const credits = isRecord(creditsData) && Array.isArray(creditsData.credits) ? creditsData.credits : [];
  if (creditsData && !(isRecord(creditsData) && 'credits' in creditsData)) {
    meta.errors.push('Unexpected credits response');
  }

  const accountBalancesData = await fetchJson('/api/account-balances');
  const accountBalances = isRecord(accountBalancesData) && Array.isArray(accountBalancesData.accountBalances)
    ? accountBalancesData.accountBalances
    : [];
  if (accountBalancesData && !(isRecord(accountBalancesData) && 'accountBalances' in accountBalancesData)) {
    meta.errors.push('Unexpected account-balances response');
  }

  const projectionMonth = transactionMonths[0] ?? toMonthKey(new Date());
  const projection = await fetchJson(`/api/engine/projection?account=SG&month=${encodeURIComponent(projectionMonth)}&months=1`);

  return {
    generatedAt: new Date().toISOString(),
    transactions,
    recurringCharges,
    ceilingRules,
    budgets,
    debts,
    credits,
    accountBalances,
    projection,
    meta: meta.errors.length || meta.limits.length ? meta : undefined,
  };
}
