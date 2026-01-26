import type { AiMeta, AiPlanStep } from './ai.types';
import { buildAiContext } from './ai.context';
import { callRemoteAI } from './ai.transport';
import { aiPlanResponseSchema } from './ai.plan.schemas';
import { buildPlanSystemPrompt, buildPlanUserPrompt } from './ai.plan.prompts';

interface AiPlanServiceOptions {
  userId: string;
  message: string;
  contextWindowMonths?: 1 | 3 | 6 | 12;
  cookies: string;
  baseUrl: string;
}

export interface AiPlanSuccess {
  steps: AiPlanStep[];
  meta: AiMeta;
}

export interface AiPlanFallback {
  reply: string;
  meta: AiMeta;
}

export interface AiPlanFailure {
  error: string;
  meta: AiMeta;
}

export type AiPlanResult = AiPlanSuccess | AiPlanFallback | AiPlanFailure;

const MAX_STEPS = 5;

const buildMeta = (contextErrors: string[], extraErrors: string[], contextWindowMonths: 1 | 3 | 6 | 12): AiMeta => {
  const errors = [...contextErrors, ...extraErrors].filter(Boolean);
  return {
    contextWindowMonths,
    toolsUsed: ['rest'],
    errors: errors.length ? errors : undefined,
  };
};

const ensureUniqueActionIds = (steps: AiPlanStep[], errors: string[]) => {
  const seen = new Set<string>();
  for (const step of steps) {
    if (seen.has(step.actionId)) {
      errors.push(`Duplicate actionId detected: ${step.actionId}`);
    }
    seen.add(step.actionId);
  }
};

const ensureStepNumbers = (steps: AiPlanStep[], errors: string[]) => {
  const seen = new Set<number>();
  for (const step of steps) {
    if (seen.has(step.step)) {
      errors.push(`Duplicate step number detected: ${step.step}`);
    }
    seen.add(step.step);
  }
};

export async function buildAiPlan({
  userId,
  message,
  contextWindowMonths,
  cookies,
  baseUrl,
}: AiPlanServiceOptions): Promise<AiPlanResult> {
  const windowMonths = contextWindowMonths ?? 6;
  const baseUrlWarning = baseUrl ? null : 'Missing base URL for context fetch';

  const context = await buildAiContext({
    request: { nextUrl: { origin: baseUrl || 'http://localhost:3000' } },
    cookies,
    windowMonths,
  });

  const systemPrompt = buildPlanSystemPrompt();
  const userPrompt = buildPlanUserPrompt(message, context);
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const rawResponse = await callRemoteAI({
    userId,
    message: combinedPrompt,
  });

  let parsedResponse: { steps: AiPlanStep[] } | null = null;
  const parseErrors: string[] = [];

  try {
    const json = JSON.parse(rawResponse) as unknown;
    const result = aiPlanResponseSchema.safeParse(json);
    if (result.success) {
      parsedResponse = {
        steps: result.data.steps.map((step) => ({
          step: step.step,
          action: step.action,
          payload: step.payload,
          requiresConfirmation: true,
          actionId: step.actionId ?? crypto.randomUUID(),
          status: 'PENDING',
        })),
      };
    } else {
      parseErrors.push(`AI plan schema invalid: ${result.error.message}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    parseErrors.push(`AI plan JSON parse failed: ${message}`);
  }

  const meta = buildMeta(
    context.meta?.errors ?? [],
    [...parseErrors, ...(baseUrlWarning ? [baseUrlWarning] : [])],
    windowMonths
  );

  if (!parsedResponse) {
    return {
      reply: rawResponse,
      meta,
    };
  }

  if (parsedResponse.steps.length > MAX_STEPS) {
    return {
      error: 'Plan exceeds max step count',
      meta: {
        ...meta,
        errors: [...(meta.errors ?? []), 'Plan exceeds max step count'],
      },
    };
  }

  const validationErrors: string[] = [];
  ensureStepNumbers(parsedResponse.steps, validationErrors);
  ensureUniqueActionIds(parsedResponse.steps, validationErrors);

  if (validationErrors.length > 0) {
    return {
      reply: rawResponse,
      meta: {
        ...meta,
        errors: [...(meta.errors ?? []), ...validationErrors],
      },
    };
  }

  return {
    steps: parsedResponse.steps,
    meta,
  };
}
