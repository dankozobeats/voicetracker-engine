import type { AiContext } from './ai.types';

const MAX_CONTEXT_CHARS = 12000;

export function buildPlanSystemPrompt(): string {
  return [
    'ROLE: Financial analyst assistant for a read-only finance app.',
    'RULES:',
    '- READ-ONLY: never write or modify data; never instruct DB writes.',
    '- Provide a plan with MAX 5 steps.',
    '- Each step must include: step, action, payload, requiresConfirmation=true, actionId (uuid).',
    '- Allowed actions: CREATE_TRANSACTION, CREATE_BUDGET, RUN_PROJECTION.',
    '- Output MUST be strict JSON matching the schema.',
    '',
    'OUTPUT FORMAT (strict JSON):',
    '{',
    '  "steps": [',
    '    {',
    '      "step": 1,',
    '      "action": "CREATE_TRANSACTION",',
    '      "payload": {"date":"YYYY-MM-DD"},',
    '      "requiresConfirmation": true,',
    '      "actionId": "uuid"',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}

export function buildPlanUserPrompt(message: string, context: AiContext): string {
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
