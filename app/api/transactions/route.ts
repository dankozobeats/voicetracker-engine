console.log('[API ENV CHECK]', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import {
  buildMonthBounds,
  normalizeDate,
  normalizeMonth,
  normalizeNumberField,
  normalizeStringField,
  parseJsonBody,
} from '@/lib/api/validators';

const SELECT_COLUMNS = 'id,user_id,date,label,amount,category,account,type,is_deferred,deferred_to,deferred_until,max_deferral_months,priority,budget_id';

const jsonError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

const toTransactionResponse = (record: Record<string, unknown>) => ({
  id: record.id,
  user_id: record.user_id,
  date: record.date,
  label: record.label,
  amount: record.amount,
  category: record.category,
  account: record.account,
  type: record.type,
  is_deferred: record.is_deferred,
  deferred_to: record.deferred_to,
  deferred_until: record.deferred_until,
  max_deferral_months: record.max_deferral_months,
  priority: record.priority,
  budget_id: record.budget_id,
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const monthParam = searchParams.get('month');

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin(); // service-role client keeps credentials on the server
    const month = normalizeMonth(monthParam, 'month');
    const { start, end } = buildMonthBounds(month);

    const { data, error } = await supabase
      .from('transactions')
      .select(SELECT_COLUMNS)
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (error) {
      console.error('[transactions][GET]', error);
      return jsonError(error.message ?? 'Failed to load transactions', 500);
    }

    return NextResponse.json({
      userId: user.id,
      month,
      transactions: (data ?? []).map(toTransactionResponse),
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return unauthorized();
    }
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
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin(); // server client ensures service credentials stay offline

    // Validate required fields
    const date = normalizeDate(payload.date, 'date');
    const label = normalizeStringField(payload.label, 'label');
    const amount = normalizeNumberField(payload.amount, 'amount');
    const category = normalizeStringField(payload.category, 'category');

    // Validate new fields with defaults
    const account = (payload.account as string) || 'SG';
    if (!['SG', 'FLOA'].includes(account)) {
      return jsonError('account must be SG or FLOA');
    }

    const type = (payload.type as string) || 'EXPENSE';
    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return jsonError('type must be INCOME or EXPENSE');
    }

    const isDeferred = Boolean(payload.is_deferred);
    const deferredTo = isDeferred && payload.deferred_to ? String(payload.deferred_to) : null;
    const deferredUntil = isDeferred && payload.deferred_until ? String(payload.deferred_until) : null;
    const maxDeferralMonths = isDeferred && payload.max_deferral_months ? Number(payload.max_deferral_months) : null;
    const priority = payload.priority ? Number(payload.priority) : 9;
    const budgetId = payload.budget_id ? String(payload.budget_id) : null;

    // Validate deferred fields if transaction is deferred
    if (isDeferred && !deferredTo) {
      return jsonError('deferred_to is required when is_deferred is true');
    }

    if (priority < 1 || priority > 9) {
      return jsonError('priority must be between 1 and 9');
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        date,
        label,
        amount,
        category,
        account,
        type,
        is_deferred: isDeferred,
        deferred_to: deferredTo,
        deferred_until: deferredUntil,
        max_deferral_months: maxDeferralMonths,
        priority,
        budget_id: budgetId,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[transactions][POST]', error);
      return jsonError(error.message ?? 'Failed to save transaction', 500);
    }

    return NextResponse.json({ transaction: toTransactionResponse(data as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    return jsonError((error as Error).message);
  }
}
