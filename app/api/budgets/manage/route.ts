import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import {
  normalizeStringField,
  normalizeNumberField,
  parseJsonBody,
} from '@/lib/api/validators';

const SELECT_COLUMNS =
  'id,user_id,category,amount,period,start_date,end_date,window_months,period_start,period_end,created_at';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const sanitizeBudget = (record: Record<string, unknown>) => ({
  id: record.id,
  user_id: record.user_id,
  category: record.category,
  amount: record.amount,
  period: record.period,
  start_date: record.start_date,
  end_date: record.end_date,
  window_months: record.window_months,
  period_start: record.period_start,
  period_end: record.period_end,
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
      .from('budgets')
      .select(SELECT_COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[budgets/manage][GET]', error);
      return jsonError('Failed to load budgets', 500);
    }

    return NextResponse.json({
      budgets: (data ?? []).map(sanitizeBudget),
    });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[budgets/manage][GET][FATAL]', err);
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
    console.error('[budgets/manage][POST][JSON_PARSE]', err);
    return jsonError((err as Error).message, 400);
  }

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    console.log('[budgets/manage][POST] Payload:', payload);

    // Validation
    const category = normalizeStringField(payload.category, 'category');
    const amount = normalizeNumberField(payload.amount, 'amount');
    const period = (payload.period as string) || 'MONTHLY';

    if (!['MONTHLY', 'ROLLING', 'MULTI'].includes(period)) {
      return jsonError('period must be MONTHLY, ROLLING, or MULTI', 400);
    }

    if (amount <= 0) {
      return jsonError('amount must be greater than 0', 400);
    }

    // Prepare insert data
    const insertData: Record<string, unknown> = {
      user_id: user.id,
      category,
      amount,
      period,
    };

    // Period-specific validation and fields
    if (period === 'ROLLING') {
      const windowMonths = payload.window_months ? Number(payload.window_months) : null;
      if (!windowMonths || windowMonths <= 0) {
        return jsonError('window_months is required and must be > 0 for ROLLING budgets', 400);
      }
      insertData.window_months = windowMonths;
    } else if (period === 'MULTI') {
      const periodStart = payload.period_start as string;
      const periodEnd = payload.period_end as string;

      if (!periodStart || !periodEnd) {
        return jsonError('period_start and period_end are required for MULTI budgets', 400);
      }

      if (periodEnd < periodStart) {
        return jsonError('period_end must be after period_start', 400);
      }

      insertData.period_start = periodStart;
      insertData.period_end = periodEnd;
    }

    console.log('[budgets/manage][POST] Insert data:', insertData);

    // Insert
    const { data, error } = await supabase
      .from('budgets')
      .insert(insertData)
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[budgets/manage][POST]', error);
      return jsonError(error.message ?? 'Failed to save budget', 500);
    }

    return NextResponse.json(
      { budget: sanitizeBudget(data as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[budgets/manage][POST][FATAL]', err);
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
    console.error('[budgets/manage][PUT][JSON_PARSE]', err);
    return jsonError((err as Error).message, 400);
  }

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    console.log('[budgets/manage][PUT] Payload:', payload);

    // Validation
    const category = normalizeStringField(payload.category, 'category');
    const amount = normalizeNumberField(payload.amount, 'amount');
    const period = (payload.period as string) || 'MONTHLY';

    if (!['MONTHLY', 'ROLLING', 'MULTI'].includes(period)) {
      return jsonError('period must be MONTHLY, ROLLING, or MULTI', 400);
    }

    if (amount <= 0) {
      return jsonError('amount must be greater than 0', 400);
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      category,
      amount,
      period,
      // Reset optional fields
      window_months: null,
      period_start: null,
      period_end: null,
    };

    // Period-specific validation and fields
    if (period === 'ROLLING') {
      const windowMonths = payload.window_months ? Number(payload.window_months) : null;
      if (!windowMonths || windowMonths <= 0) {
        return jsonError('window_months is required and must be > 0 for ROLLING budgets', 400);
      }
      updateData.window_months = windowMonths;
    } else if (period === 'MULTI') {
      const periodStart = payload.period_start as string;
      const periodEnd = payload.period_end as string;

      if (!periodStart || !periodEnd) {
        return jsonError('period_start and period_end are required for MULTI budgets', 400);
      }

      if (periodEnd < periodStart) {
        return jsonError('period_end must be after period_start', 400);
      }

      updateData.period_start = periodStart;
      updateData.period_end = periodEnd;
    }

    console.log('[budgets/manage][PUT] Update data:', updateData);

    // Update
    const { data, error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[budgets/manage][PUT]', error);
      return jsonError(error.message ?? 'Failed to update budget', 500);
    }

    return NextResponse.json({ budget: sanitizeBudget(data as Record<string, unknown>) });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[budgets/manage][PUT][FATAL]', err);
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
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[budgets/manage][DELETE]', error);
      return jsonError(error.message ?? 'Failed to delete budget', 500);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[budgets/manage][DELETE][FATAL]', err);
    return jsonError('Internal server error', 500);
  }
}
