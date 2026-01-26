export type AiContextWindow = 1 | 3 | 6 | 12;

export interface AiChatRequest {
  message: string;
  contextWindowMonths?: AiContextWindow;
}

export interface AiInsight {
  title: string;
  detail: string;
  evidence?: string[];
  severity?: 'info' | 'warning' | 'critical';
}

export type AiProposedActionType =
  | 'transaction'
  | 'budget'
  | 'projection'
  | 'alert'
  | 'note';

export interface AiProposedAction {
  type: AiProposedActionType;
  title: string;
  description?: string;
  requiresConfirmation: boolean;
  payload?: Record<string, unknown>;
}

export interface AiMeta {
  contextWindowMonths: AiContextWindow;
  toolsUsed: string[];
  errors?: string[];
  limits?: string[];
}

export type AiConfirmActionType =
  | 'CREATE_TRANSACTION'
  | 'CREATE_BUDGET'
  | 'RUN_PROJECTION';

export interface AiConfirmAction {
  actionId: string;
  type: AiConfirmActionType;
  payload: Record<string, unknown>;
}

export type AiPlanActionType =
  | 'CREATE_TRANSACTION'
  | 'CREATE_BUDGET'
  | 'RUN_PROJECTION';

export type AiPlanStatus = 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'FAILED';

export type AiPlanStepStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface AiPlanStep {
  step: number;
  action: AiPlanActionType;
  payload: Record<string, unknown>;
  requiresConfirmation: true;
  actionId: string;
  status: AiPlanStepStatus;
}

export interface AiPlan {
  planId: string;
  userId: string;
  status: AiPlanStatus;
  createdAt: string;
  expiresAt: string;
  steps: AiPlanStep[];
}

export interface AiChatResponse {
  reply: string;
  analysis?: string;
  insights?: AiInsight[];
  proposedActions?: AiProposedAction[];
  meta?: AiMeta;
}

export interface AiContext {
  generatedAt: string;
  transactions: unknown[];
  recurringCharges: unknown[];
  ceilingRules: unknown[];
  budgets: unknown | null;
  debts: unknown[];
  credits: unknown[];
  accountBalances: unknown[];
  projection: unknown | null;
  meta?: AiContextMeta;
}

export interface AiContextMeta {
  errors: string[];
  limits: string[];
}
