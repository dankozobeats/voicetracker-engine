import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import {
  normalizeStringField,
  normalizeNumberField,
  normalizeOptionalMonth,
  parseJsonBody,
} from '@/lib/api/validators';

const SELECT_COLUMNS = 'id,user_id,label,account,monthly_payment,remaining_balance,initial_balance,interest_rate,debt_start_date,start_month,end_month,excluded_months,monthly_overrides,created_at,updated_at';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const sanitizeDebt = (record: Record<string, unknown>) => ({
  id: record.id,
  user_id: record.user_id,
  label: record.label,
  account: record.account,
  monthly_payment: record.monthly_payment,
  remaining_balance: record.remaining_balance,
  initial_balance: record.initial_balance ?? null,
  interest_rate: record.interest_rate ?? null,
  debt_start_date: record.debt_start_date ?? null,
  start_month: record.start_month,
  end_month: record.end_month ?? null,
  excluded_months: record.excluded_months ?? [],
  monthly_overrides: record.monthly_overrides ?? {},
  created_at: record.created_at,
  updated_at: record.updated_at,
});

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    const { data, error } = await supabase
      .from('debts')
      .select(SELECT_COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[debts][GET]', error);
      return jsonError('Failed to load debts', 500);
    }

    return NextResponse.json({
      debts: (data ?? []).map(sanitizeDebt),
    });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[debts][GET][FATAL]', err);
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
    console.error('[debts][POST][JSON_PARSE]', err);
    return jsonError((err as Error).message, 400);
  }

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    console.log('[debts][POST] Payload:', payload);

    // Validation
    const label = normalizeStringField(payload.label, 'label');
    const monthlyPayment = normalizeNumberField(payload.monthly_payment, 'monthly_payment');
    const remainingBalance = normalizeNumberField(payload.remaining_balance, 'remaining_balance');
    const account = (payload.account as string) || 'SG';
    const startMonth = normalizeOptionalMonth(payload.start_month, 'start_month');
    const endMonth = normalizeOptionalMonth(payload.end_month, 'end_month');

    // Optional fields
    const initialBalance = payload.initial_balance ? Number(payload.initial_balance) : null;
    const interestRate = payload.interest_rate ? Number(payload.interest_rate) : null;
    const debtStartDate = payload.debt_start_date ? String(payload.debt_start_date) : null;
    const excludedMonths = (payload.excluded_months as string[]) || [];
    const monthlyOverrides = (payload.monthly_overrides as Record<string, number>) || {};

    console.log('[debts][POST] Validated:', {
      label,
      monthlyPayment,
      remainingBalance,
      account,
      startMonth,
      endMonth,
      initialBalance,
      interestRate,
      debtStartDate,
      excludedMonths,
      monthlyOverrides,
    });

    // Validation rules
    if (!['SG', 'FLOA'].includes(account)) {
      return jsonError('account must be SG or FLOA', 400);
    }

    if (monthlyPayment <= 0) {
      return jsonError('monthly_payment must be greater than 0', 400);
    }

    if (remainingBalance < 0) {
      return jsonError('remaining_balance must be greater than or equal to 0', 400);
    }

    if (!startMonth) {
      return jsonError('start_month is required', 400);
    }

    if (endMonth && endMonth < startMonth) {
      return jsonError('end_month must be after start_month', 400);
    }

    if (interestRate !== null && interestRate < 0) {
      return jsonError('interest_rate must be greater than or equal to 0', 400);
    }

    // Insert
    const { data, error } = await supabase
      .from('debts')
      .insert({
        user_id: user.id,
        label,
        account,
        monthly_payment: monthlyPayment,
        remaining_balance: remainingBalance,
        initial_balance: initialBalance,
        interest_rate: interestRate,
        debt_start_date: debtStartDate,
        start_month: startMonth,
        end_month: endMonth,
        excluded_months: excludedMonths,
        monthly_overrides: monthlyOverrides,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[debts][POST]', error);
      return jsonError(error.message ?? 'Failed to save debt', 500);
    }

    return NextResponse.json(
      { debt: sanitizeDebt(data as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[debts][POST][FATAL]', err);
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
    console.error('[debts][PUT][JSON_PARSE]', err);
    return jsonError((err as Error).message, 400);
  }

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    console.log('[debts][PUT] Payload:', payload);

    // Validation
    const label = normalizeStringField(payload.label, 'label');
    const monthlyPayment = normalizeNumberField(payload.monthly_payment, 'monthly_payment');
    const remainingBalance = normalizeNumberField(payload.remaining_balance, 'remaining_balance');
    const account = (payload.account as string) || 'SG';
    const startMonth = normalizeOptionalMonth(payload.start_month, 'start_month');
    const endMonth = normalizeOptionalMonth(payload.end_month, 'end_month');

    // Optional fields
    const initialBalance = payload.initial_balance ? Number(payload.initial_balance) : null;
    const interestRate = payload.interest_rate ? Number(payload.interest_rate) : null;
    const debtStartDate = payload.debt_start_date ? String(payload.debt_start_date) : null;
    const excludedMonths = (payload.excluded_months as string[]) || [];
    const monthlyOverrides = (payload.monthly_overrides as Record<string, number>) || {};

    console.log('[debts][PUT] Validated:', {
      label,
      monthlyPayment,
      remainingBalance,
      account,
      startMonth,
      endMonth,
      initialBalance,
      interestRate,
      debtStartDate,
      excludedMonths,
      monthlyOverrides,
    });

    // Validation rules
    if (!['SG', 'FLOA'].includes(account)) {
      return jsonError('account must be SG or FLOA', 400);
    }

    if (monthlyPayment <= 0) {
      return jsonError('monthly_payment must be greater than 0', 400);
    }

    if (remainingBalance < 0) {
      return jsonError('remaining_balance must be greater than or equal to 0', 400);
    }

    if (!startMonth) {
      return jsonError('start_month is required', 400);
    }

    if (endMonth && endMonth < startMonth) {
      return jsonError('end_month must be after start_month', 400);
    }

    if (interestRate !== null && interestRate < 0) {
      return jsonError('interest_rate must be greater than or equal to 0', 400);
    }

    // Update
    const { data, error } = await supabase
      .from('debts')
      .update({
        label,
        account,
        monthly_payment: monthlyPayment,
        remaining_balance: remainingBalance,
        initial_balance: initialBalance,
        interest_rate: interestRate,
        debt_start_date: debtStartDate,
        start_month: startMonth,
        end_month: endMonth,
        excluded_months: excludedMonths,
        monthly_overrides: monthlyOverrides,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[debts][PUT]', error);
      return jsonError(error.message ?? 'Failed to update debt', 500);
    }

    return NextResponse.json({ debt: sanitizeDebt(data as Record<string, unknown>) });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[debts][PUT][FATAL]', err);
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
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[debts][DELETE]', error);
      return jsonError(error.message ?? 'Failed to delete debt', 500);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[debts][DELETE][FATAL]', err);
    return jsonError('Internal server error', 500);
  }
}
