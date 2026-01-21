import { useCallback, useState } from 'react';
import type { AiConfirmAction } from '@/lib/ai/ai.types';

interface ConfirmStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

interface ConfirmResponse {
  status: 'success' | 'failed';
  httpStatus: number;
  result?: unknown;
  error?: string;
}

export function useAiConfirmAction() {
  const [statusById, setStatusById] = useState<Record<string, ConfirmStatus>>({});

  const confirmAction = useCallback(async (action: AiConfirmAction) => {
    setStatusById((prev) => ({
      ...prev,
      [action.actionId]: { status: 'loading' },
    }));

    try {
      const response = await fetch('/api/ai/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });

      const data = (await response.json()) as ConfirmResponse;

      if (!response.ok || data.status !== 'success') {
        const message = data.error || 'Erreur lors de la confirmation.';
        setStatusById((prev) => ({
          ...prev,
          [action.actionId]: { status: 'error', error: message },
        }));
        return data;
      }

      setStatusById((prev) => ({
        ...prev,
        [action.actionId]: { status: 'success' },
      }));

      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur réseau.';
      setStatusById((prev) => ({
        ...prev,
        [action.actionId]: { status: 'error', error: message },
      }));

      return {
        status: 'failed',
        httpStatus: 500,
        error: message,
      } satisfies ConfirmResponse;
    }
  }, []);

  return {
    confirmAction,
    statusById,
  };
}
