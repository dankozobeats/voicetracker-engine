import type { AiContext } from './ai.types';

export function buildSystemPrompt(): string {
  return [
    'ROLE: Financial analyst assistant for a read-only finance app.',
    'RULES:',
    '- READ-ONLY: never write or modify data; never instruct DB writes.',
    '- Use ONLY the provided context. If missing data, say so explicitly.',
    '- Provide evidence: cite which context fields support each insight.',
    '- Proposed actions are suggestions only, never executed, and must set requiresConfirmation=true.',
    '- Only include proposedActions when relevant; otherwise return an empty array.',
    '- Output MUST be strict JSON matching AiChatResponse.',
    '',
    'OUTPUT FORMAT (strict JSON):',
    '{',
    '  "reply": "...",',
    '  "insights": [{"title":"...","detail":"...","evidence":["..."]}],',
    '  "proposedActions": [{"type":"note","title":"...","description":"...","requiresConfirmation":true,"payload":{}}],',
    '  "meta": {"contextWindowMonths": 1, "toolsUsed": ["rest"], "errors": [], "limits": []}',
    '}',
  ].join('\n');
}

const MAX_CONTEXT_CHARS = 12000;

export function buildUserPrompt(message: string, context: AiContext): string {
  let contextPayload = JSON.stringify(context);
  if (contextPayload.length > MAX_CONTEXT_CHARS) {
    contextPayload = `${contextPayload.slice(0, MAX_CONTEXT_CHARS)}...TRUNCATED`;
  }

  return [
    'USER_MESSAGE:',
    message,
    '',
    'CONTEXT_JSON:',
    contextPayload,
  ].join('\n');
}
