import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import {
  normalizeStringField,
  normalizeNumberField,
  normalizePeriod,
  normalizeOptionalDate,
  parseJsonBody,
} from '@/lib/api/validators';
import { getEngineProjection } from '@/lib/engine-service';

const SELECT_COLUMNS =
  'id,user_id,category,amount,period,start_date,end_date,created_at';

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
  created_at: record.created_at,
});

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    // Get current month
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Call the production Engine for budget calculations
    const payload = await getEngineProjection(user.id, 'SG', month, 1);

    // Return budgets with Engine-calculated values
    return NextResponse.json({
      categoryBudgets: payload.categoryBudgets,
      rollingBudgets: payload.rollingBudgets,
      multiMonthBudgets: payload.multiMonthBudgets,
      trends: payload.trends,
    });
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('[budgets][GET][FATAL]', err);
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

    // --- Validation ---
    let category: string;
    let amount: number;
    let period: 'MONTHLY' | 'ROLLING' | 'MULTI';
    let startDate: string | null;
    let endDate: string | null;

    try {
      category = normalizeStringField(payload.category, 'category');
      amount = normalizeNumberField(payload.amount, 'amount');
      period = normalizePeriod(payload.period, 'period');
      startDate = normalizeOptionalDate(payload.startDate, 'startDate');
      endDate = normalizeOptionalDate(payload.endDate, 'endDate');
    } catch (err) {
      return jsonError((err as Error).message, 400);
    }

    if (amount <= 0) {
      return jsonError('amount must be greater than 0', 400);
    }

    if (period === 'MULTI' && (!startDate || !endDate)) {
      return jsonError(
        'startDate and endDate are required for MULTI period',
        400
      );
    }

    if (startDate && endDate && endDate < startDate) {
      return jsonError('endDate must be after startDate', 400);
    }

    // --- Insert ---
    // Avec le client RLS, le user_id est automatiquement inséré par la policy
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id, // 🔒 JAMAIS depuis le payload
        category,
        amount,
        period,
        start_date: startDate,
        end_date: endDate,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[budgets][POST]', error);
      return jsonError(error.message ?? 'Failed to save budget', 500);
    }

    return NextResponse.json(
      { budget: sanitizeBudget(data as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[budgets][POST][FATAL]', err);
    return jsonError('Internal server error', 500);
  }
}
