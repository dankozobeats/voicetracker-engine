import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import { normalizeUuid } from '@/lib/api/validators';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id?: string }> }
) {
  try {
    // Next.js 16 requires async params for App Router API routes
    const { id } = await context.params;

    if (!id) {
      return jsonError('id param is required', 400);
    }

    const normalizedId = normalizeUuid(id, 'id');
    const supabase = serverSupabase(); // server client keeps service key on the backend

    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', normalizedId)
      .select('id')
      .maybeSingle();

    if (error) {
      return jsonError('Failed to delete transaction', 500);
    }

    if (!data) {
      return jsonError('Transaction not found', 404);
    }

    return NextResponse.json({ deleted: normalizedId });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error';
    return jsonError(message, 500);
  }
}
