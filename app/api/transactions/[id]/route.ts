import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import { normalizeUuid } from '@/lib/api/validators';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id?: string }> }
) {
  try {
    const user = await getAuthenticatedUser();

    const { id } = await context.params;

    if (!id) {
      return jsonError('id param is required', 400);
    }

    const normalizedId = normalizeUuid(id, 'id');
    const supabase = serverSupabaseAdmin();

    // Parse request body
    const payload = await request.json();

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (payload.date !== undefined) updateData.date = String(payload.date);
    if (payload.label !== undefined) updateData.label = String(payload.label);
    if (payload.amount !== undefined) updateData.amount = Number(payload.amount);
    if (payload.category !== undefined) updateData.category = String(payload.category);
    if (payload.account !== undefined) updateData.account = String(payload.account);
    if (payload.type !== undefined) updateData.type = String(payload.type);
    if (payload.budget_id !== undefined) updateData.budget_id = payload.budget_id ? String(payload.budget_id) : null;
    if (payload.is_deferred !== undefined) {
      updateData.is_deferred = Boolean(payload.is_deferred);
      if (payload.is_deferred && payload.deferred_to) {
        updateData.deferred_to = String(payload.deferred_to);
        updateData.priority = payload.priority ? Number(payload.priority) : 9;
      } else {
        updateData.deferred_to = null;
        updateData.priority = 9;
      }
    }

    // Update the transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', normalizedId)
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle();

    if (error) {
      return jsonError('Failed to update transaction', 500);
    }

    if (!data) {
      return jsonError('Transaction not found', 404);
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    if ((error as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    const message =
      error instanceof Error ? error.message : 'Unexpected error';
    return jsonError(message, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id?: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    
    // Next.js 16 requires async params for App Router API routes
    const { id } = await context.params;

    if (!id) {
      return jsonError('id param is required', 400);
    }

    const normalizedId = normalizeUuid(id, 'id');
    const supabase = serverSupabaseAdmin(); // server client keeps service key on the backend

    // Vérifier que la transaction appartient à l'utilisateur avant de la supprimer
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', normalizedId)
      .eq('user_id', user.id) // 🔒 Sécurité: vérifier l'appartenance
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
    if ((error as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    const message =
      error instanceof Error ? error.message : 'Unexpected error';
    return jsonError(message, 500);
  }
}
