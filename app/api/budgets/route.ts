import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import {
  normalizeMonth,
  normalizeNumberField,
  normalizeStringField,
  normalizeUuid,
  parseJsonBody,
} from '@/lib/api/validators';

const SELECT_COLUMNS = 'id,user_id,category,monthly_limit,month';

const jsonError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const supabase = serverSupabase(); // service-role client stays server-only
    const userId = normalizeUuid(searchParams.get('userId'), 'userId');
    const month = normalizeMonth(searchParams.get('month'), 'month');
    const formattedMonth = `${month}-01`;

    const { data, error } = await supabase
      .from('budgets')
      .select(SELECT_COLUMNS)
      .eq('user_id', userId)
      .eq('month', formattedMonth)
      .order('category', { ascending: true });

    if (error) {
      return jsonError('Failed to load budgets', 500);
    }

    return NextResponse.json({ budgets: data ?? [] });
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
    const supabase = serverSupabase(); // reuse server-only client for inserts
    const userId = normalizeUuid(payload.userId, 'userId');
    const category = normalizeStringField(payload.category, 'category');
    const monthlyLimit = normalizeNumberField(payload.monthly_limit, 'monthly_limit');
    const month = normalizeMonth(payload.month, 'month');
    const formattedMonth = `${month}-01`;

    const { data, error } = await supabase
      .from('budgets')
      .insert({ user_id: userId, category, monthly_limit: monthlyLimit, month: formattedMonth })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      return jsonError('Failed to save budget', 500);
    }

    return NextResponse.json({ budget: data }, { status: 201 });
  } catch (error) {
    return jsonError((error as Error).message);
  }
}
