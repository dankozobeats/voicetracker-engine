/**
 * Audit Logger
 *
 * Centralized audit logging system for tracking user actions.
 * Logs are stored in the audit_logs table for security and compliance.
 *
 * Usage:
 * ```typescript
 * import { auditLog } from '@/lib/audit-logger';
 *
 * // In API route after successful action
 * await auditLog({
 *   userId: user.id,
 *   action: 'transaction.create',
 *   resourceType: 'transaction',
 *   resourceId: newTransaction.id,
 *   details: { amount: 100, category: 'food' },
 *   request,
 * });
 * ```
 */

import { serverSupabaseAdmin } from '@/lib/supabase/server';

export type AuditAction =
  // Transactions
  | 'transaction.create'
  | 'transaction.update'
  | 'transaction.delete'
  | 'transaction.bulk_import'
  // Budgets
  | 'budget.create'
  | 'budget.update'
  | 'budget.delete'
  | 'budget.link_charge'
  | 'budget.unlink_charge'
  // Debts
  | 'debt.create'
  | 'debt.update'
  | 'debt.delete'
  // Recurring Charges
  | 'recurring_charge.create'
  | 'recurring_charge.update'
  | 'recurring_charge.delete'
  // Account Balances
  | 'account_balance.create'
  | 'account_balance.update'
  | 'account_balance.delete'
  // Ceiling Rules
  | 'ceiling_rule.create'
  | 'ceiling_rule.update'
  | 'ceiling_rule.delete'
  // Auth
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.password_change'
  // Security
  | 'security.rate_limit_exceeded'
  | 'security.unauthorized_access'
  | 'security.invalid_token';

export type ResourceType =
  | 'transaction'
  | 'budget'
  | 'debt'
  | 'recurring_charge'
  | 'account_balance'
  | 'ceiling_rule'
  | 'user'
  | 'session';

export type AuditStatus = 'success' | 'failed' | 'denied';

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  details?: Record<string, any>;
  request?: Request;
  ipAddress?: string;
  userAgent?: string;
  status?: AuditStatus;
  errorMessage?: string;
}

/**
 * Log an audit event
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = serverSupabaseAdmin();

    // Extract IP and User-Agent from request if provided
    let ipAddress = entry.ipAddress;
    let userAgent = entry.userAgent;

    if (entry.request) {
      if (!ipAddress) {
        ipAddress = extractIP(entry.request);
      }
      if (!userAgent) {
        userAgent = entry.request.headers.get('user-agent') || 'unknown';
      }
    }

    // Insert audit log
    const { error } = await supabase.from('audit_logs').insert({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      details: entry.details,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: entry.status || 'success',
      error_message: entry.errorMessage,
    });

    if (error) {
      // Don't throw - audit logging failures shouldn't break the main flow
      console.error('[AUDIT_LOG] Failed to write audit log:', error);
    }
  } catch (error) {
    // Fail silently - audit logging is best-effort
    console.error('[AUDIT_LOG] Exception writing audit log:', error);
  }
}

/**
 * Log a failed/denied action
 */
export async function auditLogFailure(
  entry: Omit<AuditLogEntry, 'status'> & { errorMessage: string }
): Promise<void> {
  return auditLog({
    ...entry,
    status: 'failed',
  });
}

/**
 * Log an unauthorized access attempt
 */
export async function auditLogUnauthorized(
  userId: string | undefined,
  resourceType: ResourceType,
  resourceId: string | undefined,
  request?: Request
): Promise<void> {
  return auditLog({
    userId: userId || 'anonymous',
    action: 'security.unauthorized_access',
    resourceType,
    resourceId,
    status: 'denied',
    request,
    details: {
      url: request?.url,
      method: request?.method,
    },
  });
}

/**
 * Log a rate limit exceeded event
 */
export async function auditLogRateLimit(
  userId: string | undefined,
  endpoint: string,
  request?: Request
): Promise<void> {
  return auditLog({
    userId: userId || 'anonymous',
    action: 'security.rate_limit_exceeded',
    resourceType: 'session',
    status: 'denied',
    request,
    details: {
      endpoint,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Extract IP address from request headers
 */
function extractIP(request: Request): string {
  // Try various headers set by proxies/load balancers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be comma-separated list, take first
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}

/**
 * Query audit logs for a user
 * (Useful for user activity dashboard)
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    resourceType?: ResourceType;
    status?: AuditStatus;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const supabase = serverSupabaseAdmin();

  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.action) {
    query = query.eq('action', options.action);
  }

  if (options?.resourceType) {
    query = query.eq('resource_type', options.resourceType);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 50) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return data;
}

/**
 * Get audit log statistics for a user
 */
export async function getUserAuditStats(userId: string) {
  const supabase = serverSupabaseAdmin();

  // Get counts by action
  const { data: actionCounts } = await supabase
    .from('audit_logs')
    .select('action')
    .eq('user_id', userId);

  // Get counts by status
  const { data: statusCounts } = await supabase
    .from('audit_logs')
    .select('status')
    .eq('user_id', userId);

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentActivity } = await supabase
    .from('audit_logs')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  return {
    totalActions: actionCounts?.length || 0,
    actionBreakdown: countBy(actionCounts, 'action'),
    statusBreakdown: countBy(statusCounts, 'status'),
    recentActivityCount: recentActivity?.length || 0,
  };
}

// Helper function to count occurrences
function countBy(arr: any[] | null, key: string): Record<string, number> {
  if (!arr) return {};

  return arr.reduce((acc, item) => {
    const value = item[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
