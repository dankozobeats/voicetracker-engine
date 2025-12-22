import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import { buildMonthBounds, normalizeMonth, normalizeUuid } from '@/lib/api/validators';

const TRANSACTION_COLUMNS = 'id,user_id,date,label,amount,category';
const BUDGET_COLUMNS = 'id,user_id,category,monthly_limit,month';

const jsonError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

const sanitizeTransaction = (record: Record<string, unknown>) => ({
  id: record.id,
  user_id: record.user_id,
  date: record.date,
  label: record.label,
  amount: record.amount,
  category: record.category,
});

const sanitizeBudget = (record: Record<string, unknown>) => ({
  id: record.id,
  user_id: record.user_id,
  category: record.category,
  monthly_limit: record.monthly_limit,
  month: record.month,
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const supabase = serverSupabase(); // server client with service role key
    const userId = normalizeUuid(searchParams.get('userId'), 'userId');
    const month = normalizeMonth(searchParams.get('month'), 'month');
    const { start, end } = buildMonthBounds(month);

    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (transactionError) {
      return jsonError('Failed to load transactions for analysis', 500);
    }

    const formattedMonth = `${month}-01`;

    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select(BUDGET_COLUMNS)
      .eq('user_id', userId)
      .eq('month', formattedMonth)
      .order('category', { ascending: true });

    if (budgetsError) {
      return jsonError('Failed to load budgets for analysis', 500);
    }

    return NextResponse.json({
      userId,
      month,
      transactions: (transactions ?? []).map(sanitizeTransaction),
      budgets: (budgets ?? []).map(sanitizeBudget),
    });
  } catch (error) {
    return jsonError((error as Error).message);
  }
}
