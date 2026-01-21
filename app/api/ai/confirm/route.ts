import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import { auditLogFailure, auditLogUnauthorized } from '@/lib/audit-logger';
import { aiConfirmRequestSchema } from '@/lib/ai/ai.confirm.schemas';
import { confirmAiAction } from '@/lib/ai/ai.confirm.service';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    let payload: unknown;

    try {
      payload = await request.json();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid JSON';
      await auditLogFailure({
        userId: user.id,
        action: 'ai.confirm.invalid_payload',
        resourceType: 'ai_action',
        resourceId: undefined,
        errorMessage: message,
        request,
      });
      return jsonError(message, 400);
    }

    const parsed = aiConfirmRequestSchema.safeParse(payload);
    if (!parsed.success) {
      await auditLogFailure({
        userId: user.id,
        action: 'ai.confirm.invalid_payload',
        resourceType: 'ai_action',
        resourceId: undefined,
        errorMessage: 'Invalid payload',
        details: parsed.error.flatten(),
        request,
      });

      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get('cookie') ?? '';

    const result = await confirmAiAction({
      userId: user.id,
      action: parsed.data,
      baseUrl: request.nextUrl.origin,
      cookies: cookieHeader,
      request,
    });

    return NextResponse.json(result, { status: result.httpStatus });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      await auditLogUnauthorized(undefined, 'ai_action', undefined, request);
      return unauthorized();
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonError(message, 500);
  }
}
