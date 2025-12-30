import { NextRequest, NextResponse } from 'next/server';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import { normalizeMonth } from '@/lib/api/validators';
import { calculateProjection } from '@/engine/calculator';
import { generateAdvancedAlerts } from '@/engine/alerts/advanced-alerts';
import { alertTextConsumer } from '@/analysis/consumers/alert-text.consumer';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';
import type { Account, SupabaseTransactionRecord, SupabaseRecurringChargeRecord, SupabaseCeilingRuleRecord, SupabaseBudgetRecord, SupabaseAccountBalanceRecord } from '@/lib/types';
import {
  supabaseTransactionsToEngine,
  supabaseRecurringChargesToEngine,
  supabaseCeilingRulesToEngine,
  supabaseBudgetsToEngine,
} from '@/lib/adapters/supabase-to-engine';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

/**
 * GET /api/engine/projection
 *
 * Calls the production Engine (calculateProjection) with real data from Supabase.
 * Returns the full MonthProjection[] with all features:
 * - Recurring charges
 * - Ceiling rules
 * - Deferred transactions
 * - Category/Rolling/Multi-month budgets
 * - Deficit carry-over
 * - Advanced alerts
 *
 * Query params:
 * - account: 'SG' | 'FLOA' (default: 'SG')
 * - month: YYYY-MM (default: current month)
 * - months: number (default: 12) - how many months to project
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    // =========================================
    // RATE LIMITING (Phase 2 Security)
    // =========================================
    // Limit: 20 requests per minute for expensive projection calculations
    // This prevents abuse and ensures fair resource usage
    try {
      const isLimited = rateLimiter.check(
        user.id,
        'api:projection',
        RATE_LIMITS.API_EXPENSIVE
      );

      if (isLimited) {
        const resetTime = rateLimiter.getResetTime(user.id, 'api:projection');
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many projection requests. Please try again in ${resetTime} seconds.`,
            limit: RATE_LIMITS.API_EXPENSIVE,
            retryAfter: resetTime,
          },
          {
            status: 429,
            headers: {
              'Retry-After': resetTime.toString(),
            },
          }
        );
      }
    } catch (rateLimitError) {
      // Fail-open: If rate limiter fails, allow the request to continue
      console.error('[RATE_LIMIT] Error checking rate limit:', rateLimitError);
      // Continue processing the request
    }

    const supabase = serverSupabaseAdmin();
    const { searchParams } = request.nextUrl;

    // Parse query params
    const account = (searchParams.get('account') ?? 'SG') as Account;
    const startMonth = normalizeMonth(searchParams.get('month'), 'month');
    const monthsToProject = parseInt(searchParams.get('months') ?? '12', 10);

    if (!['SG', 'FLOA'].includes(account)) {
      return jsonError('Invalid account. Must be SG or FLOA.');
    }

    if (monthsToProject < 1 || monthsToProject > 24) {
      return jsonError('Months must be between 1 and 24');
    }

    // =========================================
    // 1. FETCH ALL DATA FROM SUPABASE
    // =========================================

    // Fetch transactions for this account
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('account', account)
      .order('date', { ascending: true });

    if (txError) {
      throw new Error(`Failed to load transactions: ${txError.message}`);
    }

    // Fetch recurring charges for this account
    const { data: recurringCharges, error: rcError } = await supabase
      .from('recurring_charges')
      .select('*')
      .eq('user_id', user.id)
      .eq('account', account);

    if (rcError) {
      throw new Error(`Failed to load recurring charges: ${rcError.message}`);
    }

    // Fetch ceiling rules for this account
    const { data: ceilingRules, error: crError } = await supabase
      .from('ceiling_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('account', account);

    if (crError) {
      throw new Error(`Failed to load ceiling rules: ${crError.message}`);
    }

    // Fetch all budgets (category, rolling, multi-month)
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id);

    if (budgetsError) {
      throw new Error(`Failed to load budgets: ${budgetsError.message}`);
    }

    // Fetch opening balance for this account/month
    const { data: balanceRecord, error: balanceError } = await supabase
      .from('account_balances')
      .select('*')
      .eq('user_id', user.id)
      .eq('account', account)
      .eq('month', startMonth)
      .maybeSingle();

    if (balanceError) {
      throw new Error(`Failed to load account balance: ${balanceError.message}`);
    }

    // =========================================
    // 2. TRANSFORM SUPABASE DATA TO ENGINE TYPES
    // =========================================

    const engineTransactions = supabaseTransactionsToEngine(
      (transactions ?? []) as SupabaseTransactionRecord[],
    );

    const engineRecurringCharges = supabaseRecurringChargesToEngine(
      (recurringCharges ?? []) as SupabaseRecurringChargeRecord[],
    );

    const engineCeilingRules = supabaseCeilingRulesToEngine(
      (ceilingRules ?? []) as SupabaseCeilingRuleRecord[],
    );

    const { categoryBudgets, rollingBudgets, multiMonthBudgets } =
      supabaseBudgetsToEngine((budgets ?? []) as SupabaseBudgetRecord[]);

    const initialBalance = (balanceRecord as SupabaseAccountBalanceRecord | null)?.opening_balance ?? 0;

    // =========================================
    // 3. CALL THE PRODUCTION ENGINE
    // =========================================

    const projections = calculateProjection({
      account,
      initialBalance,
      transactions: engineTransactions,
      recurringCharges: engineRecurringCharges,
      startMonth,
      months: monthsToProject,
      ceilingRules: engineCeilingRules,
      categoryBudgets,
      rollingBudgets,
      multiMonthBudgets,
    });

    // =========================================
    // 4. GENERATE ADVANCED ALERTS
    // =========================================

    const alerts = generateAdvancedAlerts(projections);
    const alertTexts = alertTextConsumer(alerts);

    // =========================================
    // 5. BUILD RESPONSE (Engine Payload format)
    // =========================================

    const latestMonth = projections[projections.length - 1];

    const payload = {
      months: projections,
      balances: [
        {
          account,
          amount: latestMonth?.endingBalance ?? initialBalance,
        },
      ],
      categoryBudgets: latestMonth?.categoryBudgets ?? [],
      rollingBudgets: latestMonth?.rollingBudgets ?? [],
      multiMonthBudgets: latestMonth?.multiMonthBudgets ?? [],
      trends: latestMonth?.trends ?? [],
      alertTexts,
    };

    return NextResponse.json({ payload });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    console.error('Engine projection error:', error);
    return jsonError((error as Error).message, 500);
  }
}
