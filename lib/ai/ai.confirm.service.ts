import { auditLog, auditLogFailure } from '@/lib/audit-logger';
import type { AiConfirmRequest } from './ai.confirm.schemas';

interface ConfirmAiActionOptions {
  userId: string;
  action: AiConfirmRequest;
  baseUrl: string;
  cookies: string;
  request?: Request;
}

export interface ConfirmAiActionResult {
  status: 'success' | 'failed';
  httpStatus: number;
  result?: unknown;
  error?: string;
}

const parseJsonMaybe = (text: string): unknown => {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const getActionAuditKey = (type: AiConfirmRequest['type']) => {
  switch (type) {
    case 'CREATE_TRANSACTION':
      return 'ai.confirm.create_transaction' as const;
    case 'CREATE_BUDGET':
      return 'ai.confirm.create_budget' as const;
    case 'RUN_PROJECTION':
      return 'ai.confirm.run_projection' as const;
    default:
      return 'ai.confirm.invalid_payload' as const;
  }
};

export async function confirmAiAction({
  userId,
  action,
  baseUrl,
  cookies,
  request,
}: ConfirmAiActionOptions): Promise<ConfirmAiActionResult> {
  const headers: Record<string, string> = {
    cookie: cookies,
    Accept: 'application/json',
  };

  let endpoint = '';
  let method: 'GET' | 'POST' = 'POST';
  let body: string | undefined;

  if (action.type === 'CREATE_TRANSACTION') {
    endpoint = '/api/transactions';
    body = JSON.stringify(action.payload);
    headers['Content-Type'] = 'application/json';
  } else if (action.type === 'CREATE_BUDGET') {
    endpoint = '/api/budgets';
    body = JSON.stringify(action.payload);
    headers['Content-Type'] = 'application/json';
  } else if (action.type === 'RUN_PROJECTION') {
    method = 'GET';
    const payload = action.payload as {
      account?: string;
      month: string;
      months: number;
    };
    const account = payload.account ?? 'SG';
    const query = new URLSearchParams({
      account,
      month: payload.month,
      months: payload.months.toString(),
    });
    endpoint = `/api/engine/projection?${query.toString()}`;
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body,
    });

    const text = await response.text();
    const parsed = parseJsonMaybe(text);

    if (!response.ok) {
      const errorMessage = `API ${response.status} ${response.statusText}`;
      await auditLogFailure({
        userId,
        action: getActionAuditKey(action.type),
        resourceType: 'ai_action',
        resourceId: action.actionId,
        errorMessage,
        details: {
          type: action.type,
          endpoint,
          response: parsed,
        },
        request,
      });

      return {
        status: 'failed',
        httpStatus: 502,
        error: errorMessage,
        result: parsed,
      };
    }

    await auditLog({
      userId,
      action: getActionAuditKey(action.type),
      resourceType: 'ai_action',
      resourceId: action.actionId,
      details: {
        type: action.type,
        endpoint,
      },
      request,
    });

    return {
      status: 'success',
      httpStatus: 200,
      result: parsed,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await auditLogFailure({
      userId,
      action: getActionAuditKey(action.type),
      resourceType: 'ai_action',
      resourceId: action.actionId,
      errorMessage: message,
      details: {
        type: action.type,
        endpoint,
      },
      request,
    });

    return {
      status: 'failed',
      httpStatus: 502,
      error: message,
    };
  }
}
