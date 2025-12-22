import type { EnginePayload } from './types';

export type ApiClientErrorCode =
  | 'MISSING_URL'
  | 'TIMEOUT'
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'INVALID_JSON';

export class ApiClientError extends Error {
  public readonly code: ApiClientErrorCode;
  public readonly status?: number;

  constructor(message: string, code: ApiClientErrorCode, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

export interface ApiClientOptions {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 6000;

export async function fetchAnalysisPayload(
  url: string,
  options: ApiClientOptions = {}
): Promise<EnginePayload> {
  if (!url) {
    throw new ApiClientError('URL is required', 'MISSING_URL');
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : undefined;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new ApiClientError(
        `HTTP error ${response.status} ${response.statusText}`,
        'HTTP_ERROR',
        response.status
      );
    }

    let payload: EnginePayload;

    try {
      payload = (await response.json()) as EnginePayload;
    } catch {
      throw new ApiClientError('Invalid JSON response', 'INVALID_JSON');
    }

    return payload;
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError('Request timeout', 'TIMEOUT');
    }

    if (error instanceof TypeError) {
      throw new ApiClientError('Network error', 'NETWORK_ERROR');
    }

    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
