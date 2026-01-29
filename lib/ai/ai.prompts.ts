import type { AiContext } from './ai.types';

export function buildSystemPrompt(): string {
  return [
    'Tu es un assistant financier personnel francophone.',
    'Tu analyses les données financières fournies et tu réponds en français de manière claire et concise.',
    '',
    'RÈGLES :',
    '- Réponds toujours en français.',
    '- Base-toi UNIQUEMENT sur les données fournies dans le contexte.',
    '- Si des données manquent, dis-le clairement.',
    '- Donne des conseils pratiques et concrets.',
    '- Ne modifie jamais de données, tu es en lecture seule.',
    '- Réponds directement en texte, pas en JSON.',
  ].join('\n');
}

const MAX_CONTEXT_CHARS = 12000;

export function buildUserPrompt(message: string, context: AiContext): string {
  let contextPayload = JSON.stringify(context);
  if (contextPayload.length > MAX_CONTEXT_CHARS) {
    contextPayload = `${contextPayload.slice(0, MAX_CONTEXT_CHARS)}...TRUNCATED`;
  }

  return [
    `Question de l'utilisateur : ${message}`,
    '',
    'Données financières (JSON) :',
    contextPayload,
  ].join('\n');
}
