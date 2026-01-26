import React, { useMemo, useState } from 'react';
import type { AiPlanStep } from '@/lib/ai/ai.types';
import { useAiConfirmAction } from '@/hooks/useAiConfirmAction';
import { AiPlanStepCard } from './AiPlanStepCard';

interface AiPlanStepperProps {
  planId: string;
  steps: AiPlanStep[];
}

const getStepDescription = (step: AiPlanStep): string | undefined => {
  const payload = step.payload;
  if (payload && typeof payload === 'object' && 'description' in payload) {
    const description = payload.description;
    if (typeof description === 'string' && description.trim().length > 0) {
      return description;
    }
  }

  return undefined;
};

export const AiPlanStepper = ({ planId, steps }: AiPlanStepperProps) => {
  const orderedSteps = useMemo(
    () => [...steps].sort((a, b) => a.step - b.step),
    [steps]
  );

  const initialIndex = orderedSteps.findIndex((step) => step.status !== 'CONFIRMED');
  const [currentIndex, setCurrentIndex] = useState<number | null>(
    initialIndex === -1 ? null : initialIndex
  );
  // Track local confirmation state to drive the stepper UI without server-side logic.
  const [confirmedSteps, setConfirmedSteps] = useState<Set<number>>(
    () => new Set(orderedSteps.filter((step) => step.status === 'CONFIRMED').map((step) => step.step))
  );

  const activeStep = currentIndex !== null ? orderedSteps[currentIndex] : null;
  const { confirmStep, status } = useAiConfirmAction(
    planId,
    activeStep ? activeStep.step : 0
  );

  const handleConfirm = async () => {
    if (!activeStep) return;

    const response = await confirmStep();
    if (response.status !== 'success') {
      return;
    }

    // Advance only when the current confirmation succeeds.
    setConfirmedSteps((prev) => new Set(prev).add(activeStep.step));

    setCurrentIndex((prev) => {
      if (prev === null) return null;
      const nextIndex = prev + 1;
      return nextIndex < orderedSteps.length ? nextIndex : null;
    });
  };

  return (
    <section className="analysis-section-group" aria-label="Plan IA">
      <header className="analysis-header">
        <h2>Plan IA</h2>
        <p className="analysis-note">Confirmez chaque étape une par une.</p>
      </header>

      <div className="analysis-grid">
        {orderedSteps.map((step, index) => {
          const isDone = confirmedSteps.has(step.step);
          const isActive = activeStep ? step.step === activeStep.step : false;

          return (
            <AiPlanStepCard
              key={`${step.actionId}-${step.step}`}
              step={step.step}
              action={step.action}
              description={getStepDescription(step)}
              isActive={isActive}
              isDone={isDone}
              onConfirm={handleConfirm}
            />
          );
        })}
      </div>

      {status.status === 'loading' ? (
        <p className="analysis-note" role="status">
          Confirmation en cours…
        </p>
      ) : null}

      {status.status === 'error' ? (
        <p className="analysis-note" role="alert">
          {status.error || 'Erreur lors de la confirmation.'}
        </p>
      ) : null}
    </section>
  );
};
