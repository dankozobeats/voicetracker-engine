import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import {
  normalizeStringField,
  normalizeNumberField,
  normalizeOptionalDate,
  parseJsonBody,
} from '@/lib/api/validators';

const SELECT_COLUMNS = 'id,user_id,label,amount,account,start_month,end_month,created_at';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const sanitizeCeilingRule = (record: Record<string, unknown>) => ({
  id: record.id,
  user_id: record.user_id,
  label: record.label,
  amount: record.amount,
  account: record.account,
  start_month: record.start_month,
  end_month: record.end_month,
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
      .from('ceiling_rules')
      .select(SELECT_COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ceiling-rules][GET]', error);
      return jsonError('Failed to load ceiling rules', 500);
    }

    return NextResponse.json({
      ceilingRules: (data ?? []).map(sanitizeCeilingRule),
    });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[ceiling-rules][GET][FATAL]', err);
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
    return jsonError((err as Error).message, 400);
  }

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    // Validation
    const label = normalizeStringField(payload.label, 'label');
    const amount = normalizeNumberField(payload.amount, 'amount');
    const account = (payload.account as string) || 'SG';
    const startMonth = normalizeOptionalDate(payload.start_month, 'start_month');
    const endMonth = normalizeOptionalDate(payload.end_month, 'end_month');

    if (!['SG', 'FLOA'].includes(account)) {
      return jsonError('account must be SG or FLOA', 400);
    }

    if (amount <= 0) {
      return jsonError('amount must be greater than 0', 400);
    }

    if (!startMonth) {
      return jsonError('start_month is required', 400);
    }

    if (endMonth && endMonth < startMonth) {
      return jsonError('end_month must be after start_month', 400);
    }

    // Insert
    const { data, error } = await supabase
      .from('ceiling_rules')
      .insert({
        user_id: user.id,
        label,
        amount,
        account,
        start_month: startMonth,
        end_month: endMonth,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[ceiling-rules][POST]', error);
      return jsonError(error.message ?? 'Failed to save ceiling rule', 500);
    }

    return NextResponse.json(
      { ceilingRule: sanitizeCeilingRule(data as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[ceiling-rules][POST][FATAL]', err);
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
      .from('ceiling_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[ceiling-rules][DELETE]', error);
      return jsonError(error.message ?? 'Failed to delete ceiling rule', 500);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[ceiling-rules][DELETE][FATAL]', err);
    return jsonError('Internal server error', 500);
  }
}
