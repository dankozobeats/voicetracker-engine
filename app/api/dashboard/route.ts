import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import { buildMonthBounds, normalizeMonth } from '@/lib/api/validators';
import { analyzeFinancialData, type SupabaseTransaction, type Alert } from '@/analysis/engine/financial-analysis.engine';
import type { EnginePayload, AlertTextEntry } from '@/lib/types';

const TRANSACTION_COLUMNS = 'id,user_id,date,label,amount,category';

const jsonError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

const sanitizeTransaction = (record: Record<string, unknown>): SupabaseTransaction => ({
  id: String(record.id),
  user_id: String(record.user_id),
  date: String(record.date),
  label: String(record.label),
  amount: Number(record.amount),
  category: record.category ? String(record.category) : null,
});

const convertAlertsToAlertTexts = (alerts: Alert[]): AlertTextEntry[] =>
  alerts.map((alert, index) => ({
    groupId: alert.id,
    severity: alert.severity,
    title: alert.type === 'NEGATIVE_NET' ? 'Solde négatif' : 'Dépense élevée',
    message: alert.message,
    priorityRank: index + 1,
  }));

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();
    const month = normalizeMonth(searchParams.get('month'), 'month');
    const { start, end } = buildMonthBounds(month);

    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (transactionError) {
      return jsonError('Failed to load transactions', 500);
    }

    const sanitizedTransactions = (transactions ?? []).map(sanitizeTransaction);
    const analysis = analyzeFinancialData(sanitizedTransactions);

    // Convertir le résultat de l'analyse au format EnginePayload attendu par le dashboard
    const payload: EnginePayload = {
      months: [
        {
          month,
          openingBalance: analysis.summary.openingBalance,
          income: analysis.summary.income,
          expenses: analysis.summary.expenses,
          fixedCharges: 0,
          deferredIn: 0,
          carriedOverDeficit: 0,
          endingBalance: analysis.summary.net,
          ceilings: [],
          deferredResolutions: [],
          recurringChargeBreakdown: [],
          categoryBudgets: [],
          categorySpending: {},
        },
      ],
      balances: [],
      categoryBudgets: [],
      rollingBudgets: [],
      multiMonthBudgets: [],
      trends: [],
      alertTexts: convertAlertsToAlertTexts(analysis.alerts),
    };

    return NextResponse.json({ payload });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    return jsonError((error as Error).message);
  }
}
