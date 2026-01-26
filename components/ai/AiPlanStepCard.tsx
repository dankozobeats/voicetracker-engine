import React from 'react';

interface AiPlanStepCardProps {
  step: number;
  action: string;
  description?: string;
  isActive: boolean;
  isDone: boolean;
  onConfirm: () => void;
}

export const AiPlanStepCard = ({
  step,
  action,
  description,
  isActive,
  isDone,
  onConfirm,
}: AiPlanStepCardProps) => {
  const isLocked = !isActive && !isDone;

  return (
    <article
      className={`analysis-panel ${isLocked ? 'opacity-50' : 'opacity-100'}`}
      aria-label={`Étape ${step}`}
    >
      <header className="panel-header">
        <p className="eyebrow">Étape {step}</p>
        <h3>{action}</h3>
      </header>

      {description ? (
        <div className="analysis-section">
          <p className="analysis-section-label">Résumé</p>
          <p className="analysis-note">{description}</p>
        </div>
      ) : null}

      <div className="analysis-section">
        {isDone ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Confirmé
          </span>
        ) : isActive ? (
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            onClick={onConfirm}
          >
            Confirmer cette étape
          </button>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Verrouillée
          </span>
        )}
      </div>
    </article>
  );
};
