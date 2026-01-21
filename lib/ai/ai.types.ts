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

export interface AiProposedAction {
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

export interface AiChatResponse {
  reply: string;
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
