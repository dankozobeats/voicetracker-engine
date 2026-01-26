import { serverSupabaseAdmin } from '@/lib/supabase/server';
import type { AiPlan, AiPlanActionType, AiPlanStatus, AiPlanStep, AiPlanStepStatus } from './ai.types';

interface CreatePlanOptions {
  userId: string;
  steps: AiPlanStep[];
  expiresAt: string;
}

interface PlanRow {
  id: string;
  user_id: string;
  status: AiPlanStatus;
  created_at: string;
  expires_at: string;
}

interface StepRow {
  id: string;
  plan_id: string;
  step_index: number;
  action_type: AiPlanActionType;
  payload: Record<string, unknown>;
  status: AiPlanStepStatus;
  created_at: string;
  confirmed_at: string | null;
}

const mapPlan = (plan: PlanRow, steps: AiPlanStep[]): AiPlan => ({
  planId: plan.id,
  userId: plan.user_id,
  status: plan.status,
  createdAt: plan.created_at,
  expiresAt: plan.expires_at,
  steps,
});

const mapStepRow = (row: StepRow): AiPlanStep => ({
  step: row.step_index,
  action: row.action_type,
  payload: row.payload,
  requiresConfirmation: true,
  actionId: row.id,
  status: row.status,
});

export const isPlanExpired = (plan: AiPlan, now = Date.now()): boolean => {
  const expiresAt = new Date(plan.expiresAt).getTime();
  return plan.status === 'EXPIRED' || expiresAt < now;
};

export const createPlan = async ({ userId, steps, expiresAt }: CreatePlanOptions): Promise<AiPlan> => {
  const supabase = serverSupabaseAdmin();
  const planId = crypto.randomUUID();

  const { data: planData, error: planError } = await supabase
    .from('ai_plans')
    .insert({
      id: planId,
      user_id: userId,
      status: 'ACTIVE',
      expires_at: expiresAt,
    })
    .select('id,user_id,status,created_at,expires_at')
    .single();

  if (planError || !planData) {
    throw new Error(planError?.message ?? 'Failed to create AI plan');
  }

  const stepRows = steps.map((step) => ({
    id: step.actionId,
    plan_id: planId,
    step_index: step.step,
    action_type: step.action,
    payload: step.payload,
    status: step.status,
  }));

  const { error: stepError } = await supabase
    .from('ai_plan_steps')
    .insert(stepRows);

  if (stepError) {
    throw new Error(stepError.message ?? 'Failed to create AI plan steps');
  }

  return mapPlan(planData as PlanRow, steps);
};

export const getPlanWithSteps = async (planId: string, userId: string): Promise<AiPlan | null> => {
  const supabase = serverSupabaseAdmin();

  const { data: planData, error: planError } = await supabase
    .from('ai_plans')
    .select('id,user_id,status,created_at,expires_at')
    .eq('id', planId)
    .eq('user_id', userId)
    .maybeSingle();

  if (planError) {
    throw new Error(planError.message ?? 'Failed to load AI plan');
  }

  if (!planData) {
    return null;
  }

  const { data: stepData, error: stepError } = await supabase
    .from('ai_plan_steps')
    .select('id,plan_id,step_index,action_type,payload,status,created_at,confirmed_at')
    .eq('plan_id', planId)
    .order('step_index', { ascending: true });

  if (stepError) {
    throw new Error(stepError.message ?? 'Failed to load AI plan steps');
  }

  const steps = (stepData ?? []).map((row) => mapStepRow(row as StepRow));

  return mapPlan(planData as PlanRow, steps);
};

export const markPlanExpired = async (planId: string): Promise<void> => {
  const supabase = serverSupabaseAdmin();

  const { error } = await supabase
    .from('ai_plans')
    .update({ status: 'EXPIRED' })
    .eq('id', planId);

  if (error) {
    throw new Error(error.message ?? 'Failed to expire AI plan');
  }
};

export const updateStepStatus = async (
  planId: string,
  stepIndex: number,
  status: AiPlanStepStatus
): Promise<void> => {
  const supabase = serverSupabaseAdmin();
  const confirmedAt = status === 'CONFIRMED' ? new Date().toISOString() : null;

  const { error } = await supabase
    .from('ai_plan_steps')
    .update({ status, confirmed_at: confirmedAt })
    .eq('plan_id', planId)
    .eq('step_index', stepIndex);

  if (error) {
    throw new Error(error.message ?? 'Failed to update AI plan step');
  }
};

export const getStep = (plan: AiPlan, stepNumber: number): AiPlanStep | undefined =>
  plan.steps.find((entry) => entry.step === stepNumber);
