import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import {
  normalizeNumberField,
  parseJsonBody,
} from '@/lib/api/validators';

const SELECT_COLUMNS = 'id,user_id,account,month,opening_balance,created_at';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const sanitizeAccountBalance = (record: Record<string, unknown>) => ({
  id: record.id,
  user_id: record.user_id,
  account: record.account,
  month: record.month,
  opening_balance: record.opening_balance,
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
      .from('account_balances')
      .select(SELECT_COLUMNS)
      .eq('user_id', user.id)
      .order('month', { ascending: false });

    if (error) {
      console.error('[account-balances][GET]', error);
      return jsonError('Failed to load account balances', 500);
    }

    return NextResponse.json({
      accountBalances: (data ?? []).map(sanitizeAccountBalance),
    });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[account-balances][GET][FATAL]', err);
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
    const account = (payload.account as string) || 'SG';
    const month = payload.month as string;
    const openingBalance = normalizeNumberField(payload.opening_balance, 'opening_balance');

    if (!['SG', 'FLOA'].includes(account)) {
      return jsonError('account must be SG or FLOA', 400);
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return jsonError('month must be in format YYYY-MM', 400);
    }

    // Check if balance already exists for this account/month
    const { data: existing } = await supabase
      .from('account_balances')
      .select('id')
      .eq('user_id', user.id)
      .eq('account', account)
      .eq('month', month)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('account_balances')
        .update({ opening_balance: openingBalance })
        .eq('id', existing.id)
        .select(SELECT_COLUMNS)
        .single();

      if (error) {
        console.error('[account-balances][POST][UPDATE]', error);
        return jsonError(error.message ?? 'Failed to update account balance', 500);
      }

      return NextResponse.json({ accountBalance: sanitizeAccountBalance(data as Record<string, unknown>) });
    }

    // Insert new
    const { data, error } = await supabase
      .from('account_balances')
      .insert({
        user_id: user.id,
        account,
        month,
        opening_balance: openingBalance,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[account-balances][POST]', error);
      return jsonError(error.message ?? 'Failed to save account balance', 500);
    }

    return NextResponse.json(
      { accountBalance: sanitizeAccountBalance(data as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[account-balances][POST][FATAL]', err);
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
      .from('account_balances')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[account-balances][DELETE]', error);
      return jsonError(error.message ?? 'Failed to delete account balance', 500);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[account-balances][DELETE][FATAL]', err);
    return jsonError('Internal server error', 500);
  }
}
