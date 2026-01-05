import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import {
  normalizeDate,
  normalizeNumberField,
  normalizeStringField,
  parseJsonBody,
} from '@/lib/api/validators';

const SELECT_COLUMNS =
  'id,user_id,date,label,amount,category,account,type,is_deferred,deferred_to,deferred_until,max_deferral_months,priority,budget_id';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

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

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;

  try {
    payload = await parseJsonBody(request);
  } catch (error) {
    return jsonError((error as Error).message, 400);
  }

  try {
    const user = await getAuthenticatedUser();

    let date: string;
    let label: string;
    let amount: number;
    let category: string;
    let account: string;
    let type: string;

    try {
      date = normalizeDate(payload.date, 'date');
      label = normalizeStringField(payload.label, 'label');
      amount = normalizeNumberField(payload.amount, 'amount');
      category = normalizeStringField(payload.category, 'category');
      account = normalizeStringField(payload.account, 'account');
      type = normalizeStringField(payload.type, 'type');
    } catch (error) {
      return jsonError((error as Error).message, 400);
    }

    if (amount <= 0) {
      return jsonError('amount must be greater than 0', 400);
    }

    if (account !== 'SG' && account !== 'FLOA') {
      return jsonError('account must be SG or FLOA', 400);
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return jsonError('type must be INCOME or EXPENSE', 400);
    }

    const supabase = serverSupabaseAdmin();
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
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[transactions][VOICE][POST]', error);
      return jsonError(error.message ?? 'Failed to save transaction', 500);
    }

    return NextResponse.json(
      { transaction: toTransactionResponse(data as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[transactions][VOICE][POST][FATAL]', error);
    return jsonError('Internal server error', 500);
  }
}
