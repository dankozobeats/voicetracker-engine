interface RemoteAiOptions {
  userId: string;
  message: string;
}

export class RemoteAiError extends Error {
  public readonly status: number | null;
  public readonly details: string;

  constructor(message: string, status: number | null, details: string) {
    super(message);
    this.name = 'RemoteAiError';
    this.status = status;
    this.details = details;
  }
}

/** Timeout for the VPS AI call (60 seconds). */
const AI_TIMEOUT_MS = 60_000;

export async function callRemoteAI({ userId, message }: RemoteAiOptions): Promise<string> {
  const baseUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;

  if (!baseUrl) {
    throw new RemoteAiError('AI_API_URL is required', null, 'Missing AI_API_URL env var');
  }

  if (!apiKey) {
    throw new RemoteAiError('AI_API_KEY is required', null, 'Missing AI_API_KEY env var');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const url = `${baseUrl.replace(/\/$/, '')}/chat`;
    console.log('[AI Transport] POST', url, '— message length:', message.length);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ userId, message }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    console.log('[AI Transport] Response status:', response.status, '— body length:', responseText.length);

    if (!response.ok) {
      throw new RemoteAiError(
        `Remote AI error: ${response.status}`,
        response.status,
        responseText || 'Empty response',
      );
    }

    return responseText;
  } catch (error: unknown) {
    if (error instanceof RemoteAiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new RemoteAiError('AI request timed out', null, `Timeout after ${AI_TIMEOUT_MS}ms`);
    }
    const msg = error instanceof Error ? error.message : 'Unknown fetch error';
    throw new RemoteAiError(msg, null, msg);
  } finally {
    clearTimeout(timeout);
  }
}
