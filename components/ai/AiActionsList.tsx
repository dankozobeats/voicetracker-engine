import React, { useMemo, useState } from 'react';
import type { AiConfirmActionType, AiProposedAction } from '@/lib/ai/ai.types';
import { useAiConfirmAction } from '@/hooks/useAiConfirmAction';
import { AiActionCard, AiActionStatus } from './AiActionCard';

const mapConfirmType = (type: AiProposedAction['type']): AiConfirmActionType | null => {
  switch (type) {
    case 'transaction':
      return 'CREATE_TRANSACTION';
    case 'budget':
      return 'CREATE_BUDGET';
    case 'projection':
      return 'RUN_PROJECTION';
    default:
      return null;
  }
};

const extractActionId = (action: AiProposedAction, fallbackId: string) => {
  const payload = action.payload;
  if (payload && typeof payload === 'object' && 'actionId' in payload) {
    const candidate = payload.actionId;
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return fallbackId;
};

const sanitizePayload = (payload: Record<string, unknown> | undefined) => {
  if (!payload) return {};
  if (!('actionId' in payload)) return payload;
  const { actionId: _actionId, ...rest } = payload as Record<string, unknown>;
  return rest;
};

interface AiActionsListProps {
  actions: AiProposedAction[];
}

export const AiActionsList = ({ actions }: AiActionsListProps) => {
  const { confirmAction, statusById } = useAiConfirmAction();
  const [ignoredActionIds, setIgnoredActionIds] = useState<Record<string, boolean>>({});

  const actionEntries = useMemo(() => {
    return actions.map((action, index) => {
      const baseId = `ai-action-${index + 1}`;
      const actionId = extractActionId(action, baseId);
      return { action, actionId };
    });
  }, [actions]);

  const handleConfirm = async (actionId: string) => {
    const entry = actionEntries.find((item) => item.actionId === actionId);
    if (!entry) return;
    if (entry.action.requiresConfirmation !== true) return;

    const confirmType = mapConfirmType(entry.action.type);
    if (!confirmType) return;

    await confirmAction({
      actionId,
      type: confirmType,
      payload: sanitizePayload(entry.action.payload),
    });
  };

  const handleIgnore = (actionId: string) => {
    setIgnoredActionIds((prev) => ({
      ...prev,
      [actionId]: true,
    }));
  };

  if (actions.length === 0) {
    return (
      <section className="analysis-panel" aria-label="Actions IA">
        <header className="panel-header">
          <p className="eyebrow">Actions IA</p>
          <h2>Aucune action proposée</h2>
        </header>
        <p className="analysis-note">Aucune action ne requiert de confirmation pour le moment.</p>
      </section>
    );
  }

  return (
    <section className="analysis-grid" aria-label="Actions proposées par l'IA">
      {actionEntries.map(({ action, actionId }) => {
        const status = statusById[actionId]?.status ?? 'idle';
        const error = statusById[actionId]?.error;
        const confirmType = mapConfirmType(action.type);
        const isIgnored = ignoredActionIds[actionId];
        const confirmDisabledReason = isIgnored
          ? 'Action ignorée.'
          : action.requiresConfirmation !== true
          ? 'Confirmation requise indisponible.'
          : confirmType
          ? undefined
          : 'Action non confirmable.';

        return (
          <AiActionCard
            key={actionId}
            action={action}
            actionId={actionId}
            status={(confirmDisabledReason ? 'idle' : status) as AiActionStatus}
            error={error}
            confirmDisabledReason={confirmDisabledReason}
            onConfirm={handleConfirm}
            onIgnore={handleIgnore}
          />
        );
      })}
    </section>
  );
};
