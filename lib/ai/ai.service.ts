import type { AiChatResponse, AiContextWindow, AiMeta } from './ai.types';
import { buildAiContext } from './ai.context';
import { buildSystemPrompt, buildUserPrompt } from './ai.prompts';
import { callRemoteAI } from './ai.transport';
import { aiChatResponseSchema } from './ai.schemas';

interface ChatAiOptions {
  userId: string;
  message: string;
  contextWindowMonths?: AiContextWindow;
  cookies: string;
}

export async function chatAi({ userId, message, contextWindowMonths, cookies }: ChatAiOptions): Promise<AiChatResponse> {
  const windowMonths = contextWindowMonths ?? 6;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const baseUrlWarning = process.env.NEXT_PUBLIC_APP_URL
    ? null
    : 'Missing NEXT_PUBLIC_APP_URL; using localhost base URL';

  const context = await buildAiContext({
    request: { nextUrl: { origin: baseUrl } },
    cookies,
    windowMonths,
  });

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(message, context);
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const rawResponse = await callRemoteAI({
    userId,
    message: combinedPrompt,
  });

  let parsedResponse: AiChatResponse | null = null;
  let parseError: string | null = null;

  try {
    const json = JSON.parse(rawResponse) as unknown;
    const result = aiChatResponseSchema.safeParse(json);
    if (result.success) {
      parsedResponse = result.data;
    } else {
      parseError = `AI response schema invalid: ${result.error.message}`;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    parseError = `AI response JSON parse failed: ${message}`;
    parsedResponse = null;
  }

  const errors = [
    ...(context.meta?.errors ?? []),
    ...(baseUrlWarning ? [baseUrlWarning] : []),
    ...(parseError ? [parseError] : []),
  ];
  const limits = context.meta?.limits ?? [];

  const meta: AiMeta = {
    contextWindowMonths: windowMonths,
    toolsUsed: ['rest'],
    errors: errors.length ? errors : undefined,
    limits: limits.length ? limits : undefined,
  };

  if (parsedResponse) {
    return {
      ...parsedResponse,
      insights: parsedResponse.insights ?? [],
      proposedActions: parsedResponse.proposedActions ?? [],
      meta,
    };
  }

  return {
    reply: rawResponse,
    meta,
  };
}
