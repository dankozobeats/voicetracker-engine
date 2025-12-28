import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import {
  normalizeStringField,
  normalizeNumberField,
  normalizeOptionalMonth,
  parseJsonBody,
} from '@/lib/api/validators';

const SELECT_COLUMNS = 'id,user_id,label,amount,account,type,start_month,end_month,excluded_months,monthly_overrides,reminders,created_at';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const sanitizeRecurringCharge = (record: Record<string, unknown>) => ({
  id: record.id,
  user_id: record.user_id,
  label: record.label,
  amount: record.amount,
  account: record.account,
  type: record.type,
  start_date: record.start_month,
  end_date: record.end_month,
  excluded_months: record.excluded_months ?? [],
  monthly_overrides: record.monthly_overrides ?? {},
  reminders: record.reminders ?? [],
  created_at: record.created_at,
});

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    const { data, error } = await supabase
      .from('recurring_charges')
      .select(SELECT_COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[recurring-charges][GET]', error);
      return jsonError('Failed to load recurring charges', 500);
    }

    return NextResponse.json({
      recurringCharges: (data ?? []).map(sanitizeRecurringCharge),
    });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[recurring-charges][GET][FATAL]', err);
    return jsonError('Internal server error', 500);
  }
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;

  try {
    payload = await parseJsonBody(request);
  } catch (err) {
    console.error('[recurring-charges][POST][JSON_PARSE]', err);
    return jsonError((err as Error).message, 400);
  }

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    console.log('[recurring-charges][POST] Payload:', payload);

    // Validation
    const label = normalizeStringField(payload.label, 'label');
    const amount = normalizeNumberField(payload.amount, 'amount');
    const account = (payload.account as string) || 'SG';
    const type = (payload.type as string) || 'EXPENSE';
    const startMonth = normalizeOptionalMonth(payload.start_date, 'start_date');
    const endMonth = normalizeOptionalMonth(payload.end_date, 'end_date');
    const excludedMonths = (payload.excluded_months as string[]) || [];
    const monthlyOverrides = (payload.monthly_overrides as Record<string, number>) || {};
    const reminders = (payload.reminders as Array<Record<string, unknown>>) || [];

    console.log('[recurring-charges][POST] Validated:', {
      label,
      amount,
      account,
      type,
      startMonth,
      endMonth,
      excludedMonths,
      monthlyOverrides,
      reminders,
    });

    if (!['SG', 'FLOA'].includes(account)) {
      return jsonError('account must be SG or FLOA', 400);
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return jsonError('type must be INCOME or EXPENSE', 400);
    }

    if (amount <= 0) {
      return jsonError('amount must be greater than 0', 400);
    }

    if (!startMonth) {
      return jsonError('start_date is required', 400);
    }

    if (endMonth && endMonth < startMonth) {
      return jsonError('end_date must be after start_date', 400);
    }

    // Insert
    const { data, error } = await supabase
      .from('recurring_charges')
      .insert({
        user_id: user.id,
        label,
        amount,
        account,
        type,
        start_month: startMonth,
        end_month: endMonth,
        excluded_months: excludedMonths,
        monthly_overrides: monthlyOverrides,
        reminders,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[recurring-charges][POST]', error);
      return jsonError(error.message ?? 'Failed to save recurring charge', 500);
    }

    return NextResponse.json(
      { recurringCharge: sanitizeRecurringCharge(data as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[recurring-charges][POST][FATAL]', err);
    return jsonError('Internal server error', 500);
  }
}

/* -------------------------------------------------------------------------- */
/*                                    PUT                                     */
/* -------------------------------------------------------------------------- */

export async function PUT(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return jsonError('id is required', 400);
  }

  let payload: Record<string, unknown>;

  try {
    payload = await parseJsonBody(request);
  } catch (err) {
    console.error('[recurring-charges][PUT][JSON_PARSE]', err);
    return jsonError((err as Error).message, 400);
  }

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    console.log('[recurring-charges][PUT] Payload:', payload);

    // Validation
    const label = normalizeStringField(payload.label, 'label');
    const amount = normalizeNumberField(payload.amount, 'amount');
    const account = (payload.account as string) || 'SG';
    const type = (payload.type as string) || 'EXPENSE';
    const startMonth = normalizeOptionalMonth(payload.start_date, 'start_date');
    const endMonth = normalizeOptionalMonth(payload.end_date, 'end_date');
    const excludedMonths = (payload.excluded_months as string[]) || [];
    const monthlyOverrides = (payload.monthly_overrides as Record<string, number>) || {};
    const reminders = (payload.reminders as Array<Record<string, unknown>>) || [];

    console.log('[recurring-charges][PUT] Validated:', {
      label,
      amount,
      account,
      type,
      startMonth,
      endMonth,
      excludedMonths,
      monthlyOverrides,
      reminders,
    });

    if (!['SG', 'FLOA'].includes(account)) {
      return jsonError('account must be SG or FLOA', 400);
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return jsonError('type must be INCOME or EXPENSE', 400);
    }

    if (amount <= 0) {
      return jsonError('amount must be greater than 0', 400);
    }

    if (!startMonth) {
      return jsonError('start_date is required', 400);
    }

    if (endMonth && endMonth < startMonth) {
      return jsonError('end_date must be after start_date', 400);
    }

    // Update
    const { data, error} = await supabase
      .from('recurring_charges')
      .update({
        label,
        amount,
        account,
        type,
        start_month: startMonth,
        end_month: endMonth,
        excluded_months: excludedMonths,
        monthly_overrides: monthlyOverrides,
        reminders,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[recurring-charges][PUT]', error);
      return jsonError(error.message ?? 'Failed to update recurring charge', 500);
    }

    return NextResponse.json({ recurringCharge: sanitizeRecurringCharge(data as Record<string, unknown>) });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[recurring-charges][PUT][FATAL]', err);
    return jsonError('Internal server error', 500);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   DELETE                                   */
/* -------------------------------------------------------------------------- */

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return jsonError('id is required', 400);
  }

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    const { error } = await supabase
      .from('recurring_charges')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[recurring-charges][DELETE]', error);
      return jsonError(error.message ?? 'Failed to delete recurring charge', 500);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[recurring-charges][DELETE][FATAL]', err);
    return jsonError('Internal server error', 500);
  }
}
