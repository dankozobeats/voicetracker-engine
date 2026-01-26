import { useCallback, useMemo, useState } from 'react';
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

interface PlanConfirmPayload {
  planId: string;
  step: number;
}

export function useAiConfirmAction(): {
  confirmAction: (action: AiConfirmAction) => Promise<ConfirmResponse>;
  statusById: Record<string, ConfirmStatus>;
};
export function useAiConfirmAction(planId: string, step: number): {
  confirmStep: () => Promise<ConfirmResponse>;
  status: ConfirmStatus;
};
export function useAiConfirmAction(planId?: string, step?: number) {
  const [statusById, setStatusById] = useState<Record<string, ConfirmStatus>>({});
  const [stepStatus, setStepStatus] = useState<ConfirmStatus>({ status: 'idle' });

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

  const confirmStep = useCallback(async () => {
    if (!planId || !step) {
      return {
        status: 'failed',
        httpStatus: 400,
        error: 'PlanId ou step manquant.',
      } satisfies ConfirmResponse;
    }

    const payload: PlanConfirmPayload = { planId, step };
    setStepStatus({ status: 'loading' });

    try {
      const response = await fetch('/api/ai/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as ConfirmResponse;

      if (!response.ok || data.status !== 'success') {
        const message = data.error || 'Erreur lors de la confirmation.';
        setStepStatus({ status: 'error', error: message });
        return data;
      }

      setStepStatus({ status: 'success' });
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur réseau.';
      setStepStatus({ status: 'error', error: message });
      return {
        status: 'failed',
        httpStatus: 500,
        error: message,
      } satisfies ConfirmResponse;
    }
  }, [planId, step]);

  const stepState = useMemo(() => stepStatus, [stepStatus]);

  if (planId && step) {
    return {
      confirmStep,
      status: stepState,
    };
  }

  return {
    confirmAction,
    statusById,
  };
}
