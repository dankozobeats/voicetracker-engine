import type { EnginePayload } from './types';

export async function fetchAnalysisPayload(url: string): Promise<EnginePayload> {
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Unable to fetch analysis payload (${response.status} ${response.statusText})`);
  }

  return response.json() as Promise<EnginePayload>;
}
