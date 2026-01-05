import type { TransactionCreateInput } from '@/src/voice/voice.index';

export class VoiceApiError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.name = 'VoiceApiError';
    this.status = status;
  }
}

export async function createVoiceTransaction(input: TransactionCreateInput): Promise<Record<string, unknown>> {
  const response = await fetch('/api/transactions/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // ignore
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as { error?: unknown }).error ?? 'Request failed')
        : 'Request failed';
    throw new VoiceApiError(message, response.status);
  }

  return (payload ?? {}) as Record<string, unknown>;
}

