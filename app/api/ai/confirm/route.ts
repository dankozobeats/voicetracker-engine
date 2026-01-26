import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import { auditLogFailure, auditLogUnauthorized } from '@/lib/audit-logger';
import { aiConfirmRequestSchema, aiDirectConfirmSchema } from '@/lib/ai/ai.confirm.schemas';
import { confirmAiAction } from '@/lib/ai/ai.confirm.service';
import { getPlanWithSteps, getStep, isPlanExpired, markPlanExpired, updateStepStatus } from '@/lib/ai/ai.plan.repository';

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

    if ('planId' in parsed.data) {
      const planId = parsed.data.planId;
      const stepNumber = parsed.data.step;
      const plan = await getPlanWithSteps(planId, user.id);

      if (!plan || plan.userId !== user.id) {
        await auditLogFailure({
          userId: user.id,
          action: 'ai.confirm.failed',
          resourceType: 'ai_plan_step',
          resourceId: planId,
          errorMessage: 'Plan not found',
          request,
        });
        return jsonError('Plan not found', 404);
      }

      if (isPlanExpired(plan)) {
        await markPlanExpired(planId);
        await auditLogFailure({
          userId: user.id,
          action: 'ai.confirm.failed',
          resourceType: 'ai_plan_step',
          resourceId: planId,
          errorMessage: 'Plan expired',
          request,
        });
        return jsonError('Plan expired', 410);
      }

      const step = getStep(plan, stepNumber);
      if (!step) {
        await auditLogFailure({
          userId: user.id,
          action: 'ai.confirm.failed',
          resourceType: 'ai_plan_step',
          resourceId: planId,
          errorMessage: 'Step not found',
          details: { step: stepNumber },
          request,
        });
        return jsonError('Step not found', 400);
      }

      if (stepNumber > 1) {
        const previousStep = getStep(plan, stepNumber - 1);
        if (!previousStep || previousStep.status !== 'CONFIRMED') {
          await auditLogFailure({
            userId: user.id,
            action: 'ai.confirm.failed',
            resourceType: 'ai_plan_step',
            resourceId: planId,
            errorMessage: 'Previous step not confirmed',
            details: { step: stepNumber },
            request,
          });
          return jsonError('Previous step not confirmed', 400);
        }
      }

      if (step.status === 'CONFIRMED') {
        await auditLogFailure({
          userId: user.id,
          action: 'ai.confirm.failed',
          resourceType: 'ai_plan_step',
          resourceId: step.actionId,
          errorMessage: 'Step already confirmed',
          details: { step: stepNumber },
          request,
        });
        return jsonError('Step already confirmed', 409);
      }

      const directPayload = {
        actionId: step.actionId,
        type: step.action,
        payload: step.payload,
      };
      const directParse = aiDirectConfirmSchema.safeParse(directPayload);
      if (!directParse.success) {
        await auditLogFailure({
          userId: user.id,
          action: 'ai.confirm.failed',
          resourceType: 'ai_plan_step',
          resourceId: step.actionId,
          errorMessage: 'Invalid step payload',
          details: directParse.error.flatten(),
          request,
        });
        return jsonError('Invalid step payload', 400);
      }

      const result = await confirmAiAction({
        userId: user.id,
        action: directParse.data,
        baseUrl: request.nextUrl.origin,
        cookies: cookieHeader,
        request,
        resourceType: 'ai_plan_step',
        failureAction: 'ai.confirm.failed',
      });

      await updateStepStatus(planId, stepNumber, result.status === 'success' ? 'CONFIRMED' : 'FAILED');

      return NextResponse.json(
        { ...result, planId, step: stepNumber, actionId: step.actionId },
        { status: result.httpStatus }
      );
    }

    if ('type' in parsed.data) {
      const result = await confirmAiAction({
        userId: user.id,
        action: parsed.data,
        baseUrl: request.nextUrl.origin,
        cookies: cookieHeader,
        request,
      });

      return NextResponse.json(result, { status: result.httpStatus });
    }

    return jsonError('Invalid payload', 400);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      await auditLogUnauthorized(undefined, 'ai_action', undefined, request);
      return unauthorized();
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonError(message, 500);
  }
}
