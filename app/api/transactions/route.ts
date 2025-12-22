console.log('[API ENV CHECK]', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import {
  buildMonthBounds,
  normalizeDate,
  normalizeMonth,
  normalizeNumberField,
  normalizeStringField,
  normalizeUuid,
  parseJsonBody,
} from '@/lib/api/validators';

const SELECT_COLUMNS = 'id,user_id,date,label,amount,category';

const jsonError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

const toTransactionResponse = (record: Record<string, unknown>) => ({
  id: record.id,
  user_id: record.user_id,
  date: record.date,
  label: record.label,
  amount: record.amount,
  category: record.category,
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userIdParam = searchParams.get('userId');
  const monthParam = searchParams.get('month');

  try {
    const supabase = serverSupabase(); // service-role client keeps credentials on the server
    const userId = normalizeUuid(userIdParam, 'userId');
    const month = normalizeMonth(monthParam, 'month');
    const { start, end } = buildMonthBounds(month);

    const { data, error } = await supabase
      .from('transactions')
      .select(SELECT_COLUMNS)
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (error) {
      console.error('[transactions][GET]', error);
      return jsonError(error.message ?? 'Failed to load transactions', 500);
    }

    return NextResponse.json({
      userId,
      month,
      transactions: (data ?? []).map(toTransactionResponse),
    });
  } catch (error) {
    return jsonError((error as Error).message);
  }
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;

  try {
    payload = await parseJsonBody(request);
  } catch (error) {
    return jsonError((error as Error).message);
  }

  try {
    const supabase = serverSupabase(); // server client ensures service credentials stay offline
    const userId = normalizeUuid(payload.userId, 'userId');
    const date = normalizeDate(payload.date, 'date');
    const label = normalizeStringField(payload.label, 'label');
    const amount = normalizeNumberField(payload.amount, 'amount');
    const category = normalizeStringField(payload.category, 'category');

    const { data, error } = await supabase
      .from('transactions')
      .insert({ user_id: userId, date, label, amount, category })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[transactions][POST]', error);
      return jsonError(error.message ?? 'Failed to save transaction', 500);
    }

    return NextResponse.json({ transaction: toTransactionResponse(data as unknown) }, { status: 201 });
  } catch (error) {
    return jsonError((error as Error).message);
  }
}
