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

export async function callRemoteAI({ userId, message }: RemoteAiOptions): Promise<string> {
  const baseUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;

  if (!baseUrl) {
    throw new RemoteAiError('AI_API_URL is required', null, 'Missing AI_API_URL env var');
  }

  if (!apiKey) {
    throw new RemoteAiError('AI_API_KEY is required', null, 'Missing AI_API_KEY env var');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ userId, message }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new RemoteAiError(
      `Remote AI error: ${response.status}`,
      response.status,
      responseText || 'Empty response'
    );
  }

  return responseText;
}
