import type { AiChatResponse, AiContextWindow, AiMeta } from './ai.types';
import { buildAiContext } from './ai.context';
import { buildSystemPrompt, buildUserPrompt } from './ai.prompts';
import { callRemoteAI } from './ai.transport';

interface ChatAiOptions {
  userId: string;
  message: string;
  contextWindowMonths?: AiContextWindow;
  cookies: string;
}

export async function chatAi({ userId, message, contextWindowMonths, cookies }: ChatAiOptions): Promise<AiChatResponse> {
  const windowMonths = contextWindowMonths ?? 6;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const warnings: string[] = [];
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push('Missing NEXT_PUBLIC_APP_URL; using localhost base URL');
  }

  console.log('[AI Service] Building context…');
  const context = await buildAiContext({
    request: { nextUrl: { origin: baseUrl } },
    cookies,
    windowMonths,
  });
  console.log('[AI Service] Context built. Errors:', context.meta?.errors?.length ?? 0);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(message, context);
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

  console.log('[AI Service] Calling remote AI…');
  const rawResponse = await callRemoteAI({ userId, message: combinedPrompt });
  console.log('[AI Service] Got response, length:', rawResponse.length);

  const meta: AiMeta = {
    contextWindowMonths: windowMonths,
    toolsUsed: ['rest'],
    errors: [
      ...(context.meta?.errors ?? []),
      ...warnings,
    ],
    limits: context.meta?.limits ?? [],
  };
  if (!meta.errors?.length) delete meta.errors;
  if (!meta.limits?.length) delete meta.limits;

  // Try to parse as JSON first (in case the AI responds with structured data)
  try {
    const json = JSON.parse(rawResponse) as Record<string, unknown>;
    if (typeof json.reply === 'string') {
      return {
        reply: json.reply,
        insights: Array.isArray(json.insights) ? json.insights as AiChatResponse['insights'] : [],
        proposedActions: Array.isArray(json.proposedActions) ? json.proposedActions as AiChatResponse['proposedActions'] : [],
        meta,
      };
    }
  } catch {
    // Not JSON — that's fine, treat as plain text
  }

  // Plain text response from the AI
  return {
    reply: rawResponse.trim(),
    insights: [],
    proposedActions: [],
    meta,
  };
}
