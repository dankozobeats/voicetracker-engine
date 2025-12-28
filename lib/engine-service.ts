import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { calculateProjection } from '@/engine/calculator';
import { generateAdvancedAlerts } from '@/engine/alerts/advanced-alerts';
import { alertTextConsumer } from '@/analysis/consumers/alert-text.consumer';
import type { Account, SupabaseTransactionRecord, SupabaseRecurringChargeRecord, SupabaseCeilingRuleRecord, SupabaseBudgetRecord, SupabaseAccountBalanceRecord, EnginePayload } from '@/lib/types';
import {
  supabaseTransactionsToEngine,
  supabaseRecurringChargesToEngine,
  supabaseCeilingRulesToEngine,
  supabaseBudgetsToEngine,
} from '@/lib/adapters/supabase-to-engine';

/**
 * Fetches and processes financial data using the production Engine.
 * This is the single source of truth for all financial calculations.
 *
 * @param userId - The authenticated user's ID
 * @param account - The account to analyze (SG or FLOA)
 * @param startMonth - Starting month in YYYY-MM format
 * @param months - Number of months to project (1-24)
 * @returns EnginePayload with complete financial projection
 */
export async function getEngineProjection(
  userId: string,
  account: Account,
  startMonth: string,
  months: number,
): Promise<EnginePayload> {
  const supabase = serverSupabaseAdmin();

  // =========================================
  // 1. FETCH ALL DATA FROM SUPABASE
  // =========================================

  // Fetch transactions for this account
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('account', account)
    .order('date', { ascending: true });

  if (txError) {
    throw new Error(`Failed to load transactions: ${txError.message}`);
  }

  // Fetch recurring charges for this account
  const { data: recurringCharges, error: rcError } = await supabase
    .from('recurring_charges')
    .select('*')
    .eq('user_id', userId)
    .eq('account', account);

  if (rcError) {
    throw new Error(`Failed to load recurring charges: ${rcError.message}`);
  }

  // Fetch ceiling rules for this account
  const { data: ceilingRules, error: crError } = await supabase
    .from('ceiling_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('account', account);

  if (crError) {
    throw new Error(`Failed to load ceiling rules: ${crError.message}`);
  }

  // Fetch all budgets (category, rolling, multi-month)
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId);

  if (budgetsError) {
    throw new Error(`Failed to load budgets: ${budgetsError.message}`);
  }

  // Fetch budget-charge links
  const budgetIds = (budgets ?? []).map(b => b.id);
  const { data: budgetChargeLinks, error: linksError } = budgetIds.length > 0
    ? await supabase
        .from('budget_recurring_charges')
        .select('budget_id, recurring_charge_id')
        .in('budget_id', budgetIds)
    : { data: [], error: null };

  if (linksError) {
    throw new Error(`Failed to load budget-charge links: ${linksError.message}`);
  }

  // Fetch opening balance for this account/month
  const { data: balanceRecord, error: balanceError } = await supabase
    .from('account_balances')
    .select('*')
    .eq('user_id', userId)
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
    supabaseBudgetsToEngine(
      (budgets ?? []) as SupabaseBudgetRecord[],
      budgetChargeLinks ?? [],
    );

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
    months,
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

  const payload: EnginePayload = {
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

  return payload;
}
