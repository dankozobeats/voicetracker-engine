import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import {
  normalizeDate,
  normalizeNumberField,
  normalizeStringField,
  parseJsonBody,
} from '@/lib/api/validators';

const SELECT_COLUMNS = 'id,user_id,label,total_amount,remaining_amount,monthly_payment,start_date';

const jsonError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin(); // keep service key off the client

    const { data, error } = await supabase
      .from('credits')
      .select(SELECT_COLUMNS)
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });

    if (error) {
      return jsonError('Failed to load credits', 500);
    }

    return NextResponse.json({ credits: data ?? [] });
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
    const supabase = serverSupabaseAdmin(); // use server-only credentials during writes
    const label = normalizeStringField(payload.label, 'label');
    const totalAmount = normalizeNumberField(payload.total_amount, 'total_amount');
    const remainingAmount = normalizeNumberField(payload.remaining_amount, 'remaining_amount');
    const monthlyPayment = normalizeNumberField(payload.monthly_payment, 'monthly_payment');
    const startDate = normalizeDate(payload.start_date, 'start_date');

    const { data, error } = await supabase
      .from('credits')
      .insert({
        user_id: user.id,
        label,
        total_amount: totalAmount,
        remaining_amount: remainingAmount,
        monthly_payment: monthlyPayment,
        start_date: startDate,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      return jsonError('Failed to save credit', 500);
    }

    return NextResponse.json({ credit: data }, { status: 201 });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    return jsonError((error as Error).message);
  }
}
