import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import { auditLog, auditLogFailure, auditLogUnauthorized } from '@/lib/audit-logger';
import { aiPlanRequestSchema } from '@/lib/ai/ai.plan.schemas';
import { buildAiPlan } from '@/lib/ai/ai.plan.service';
import { createPlan } from '@/lib/ai/ai.plan.repository';

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
        action: 'ai.plan.create',
        resourceType: 'ai_plan',
        resourceId: undefined,
        errorMessage: message,
        request,
      });
      return jsonError(message, 400);
    }

    const parsed = aiPlanRequestSchema.safeParse(payload);
    if (!parsed.success) {
      await auditLogFailure({
        userId: user.id,
        action: 'ai.plan.create',
        resourceType: 'ai_plan',
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

    const planResult = await buildAiPlan({
      userId: user.id,
      message: parsed.data.message,
      contextWindowMonths: parsed.data.contextWindowMonths,
      cookies: cookieHeader,
      baseUrl: request.nextUrl.origin,
    });

    if ('error' in planResult) {
      await auditLogFailure({
        userId: user.id,
        action: 'ai.plan.create',
        resourceType: 'ai_plan',
        resourceId: undefined,
        errorMessage: planResult.error,
        details: { meta: planResult.meta },
        request,
      });
      return jsonError(planResult.error, 400);
    }

    if ('reply' in planResult) {
      await auditLogFailure({
        userId: user.id,
        action: 'ai.plan.create',
        resourceType: 'ai_plan',
        resourceId: undefined,
        errorMessage: 'AI plan invalid',
        details: { meta: planResult.meta },
        request,
      });
      return NextResponse.json({ reply: planResult.reply, meta: planResult.meta });
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const plan = await createPlan({
      userId: user.id,
      steps: planResult.steps,
      expiresAt,
    });

    await auditLog({
      userId: user.id,
      action: 'ai.plan.create',
      resourceType: 'ai_plan',
      resourceId: plan.planId,
      details: {
        stepCount: plan.steps.length,
      },
      request,
    });

    return NextResponse.json({
      planId: plan.planId,
      steps: plan.steps,
      meta: planResult.meta,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      await auditLogUnauthorized(undefined, 'ai_plan', undefined, request);
      return unauthorized();
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonError(message, 500);
  }
}
