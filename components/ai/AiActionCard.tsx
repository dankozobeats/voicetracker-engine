import React from 'react';
import type { AiProposedAction } from '@/lib/ai/ai.types';

export type AiActionStatus = 'idle' | 'loading' | 'success' | 'error';

interface AiActionCardProps {
  action: AiProposedAction;
  actionId: string;
  status: AiActionStatus;
  error?: string;
  confirmDisabledReason?: string;
  onConfirm: (actionId: string) => void;
  onIgnore: (actionId: string) => void;
}

const formatPayload = (payload: Record<string, unknown> | undefined): string => {
  if (!payload || Object.keys(payload).length === 0) {
    return 'Aucun payload';
  }

  return Object.entries(payload)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
};

export const AiActionCard = ({
  action,
  actionId,
  status,
  error,
  confirmDisabledReason,
  onConfirm,
  onIgnore,
}: AiActionCardProps) => {
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const disableConfirm = Boolean(confirmDisabledReason) || isLoading || isSuccess;

  return (
    <article className="analysis-panel" aria-label={`Action IA ${action.title}`}>
      <header className="panel-header">
        <p className="eyebrow">Action proposée</p>
        <h3>{action.title}</h3>
        <p className="panel-subtitle">Type: {action.type}</p>
      </header>

      {action.description ? (
        <div className="analysis-section">
          <p className="analysis-section-label">Rationale</p>
          <p className="analysis-note">{action.description}</p>
        </div>
      ) : null}

      <div className="analysis-section">
        <p className="analysis-section-label">Payload</p>
        <p className="analysis-note">{formatPayload(action.payload)}</p>
      </div>

      {confirmDisabledReason ? (
        <p className="analysis-note" role="status">
          {confirmDisabledReason}
        </p>
      ) : null}

      {isSuccess ? (
        <p className="analysis-note" role="status">Action confirmée.</p>
      ) : null}

      {isError ? (
        <p className="analysis-note" role="alert">{error || 'Erreur lors de la confirmation.'}</p>
      ) : null}

      <div className="analysis-section">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={() => onConfirm(actionId)}
            disabled={disableConfirm}
          >
            {isLoading ? 'Confirmation…' : isSuccess ? 'Confirmée' : 'Confirmer'}
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onIgnore(actionId)}
            disabled={isLoading || isSuccess}
          >
            Ignorer
          </button>
        </div>
      </div>
    </article>
  );
};
