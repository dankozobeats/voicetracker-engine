/**
 * DATA TRANSFORMATION LAYER
 *
 * Converts between Supabase database records and Engine types.
 * This layer is read-only - it never modifies the Engine or calls business logic.
 * It's purely structural transformation.
 */

import type {
  SupabaseTransactionRecord,
  SupabaseRecurringChargeRecord,
  SupabaseCeilingRuleRecord,
  SupabaseBudgetRecord,
} from '@/lib/types';

import type {
  Transaction,
  RecurringCharge,
  CeilingRule,
  CategoryBudget,
  RollingCategoryBudget,
  MultiMonthBudget,
} from '@/engine/types';

/**
 * Converts a Supabase transaction record to Engine Transaction type
 */
export const supabaseTransactionToEngine = (
  record: SupabaseTransactionRecord,
): Transaction => ({
  id: record.id,
  account: record.account,
  type: record.type,
  amount: record.amount,
  date: record.date,
  category: record.category ?? undefined,
  isDeferred: record.is_deferred || undefined,
  deferredTo: record.deferred_to ?? undefined,
  deferredUntil: record.deferred_until ?? undefined,
  maxDeferralMonths: record.max_deferral_months ?? undefined,
  priority: record.priority,
});

/**
 * Converts a Supabase recurring charge record to Engine RecurringCharge type
 */
export const supabaseRecurringChargeToEngine = (
  record: SupabaseRecurringChargeRecord,
): RecurringCharge => ({
  id: record.id,
  account: record.account,
  type: record.type,
  amount: record.amount,
  startMonth: record.start_month,
  endMonth: record.end_month ?? undefined,
  excludedMonths: record.excluded_months ?? undefined,
  monthlyOverrides: record.monthly_overrides ?? undefined,
});

/**
 * Converts a Supabase ceiling rule record to Engine CeilingRule type
 */
export const supabaseCeilingRuleToEngine = (
  record: SupabaseCeilingRuleRecord,
): CeilingRule => ({
  id: record.id,
  account: record.account,
  amount: record.amount,
  startMonth: record.start_month,
  endMonth: record.end_month ?? undefined,
});

/**
 * Converts Supabase budget records to Engine budget types
 * Returns separate arrays for category, rolling, and multi-month budgets
 */
export const supabaseBudgetsToEngine = (
  records: SupabaseBudgetRecord[],
  budgetChargeLinks?: Array<{ budget_id: string; recurring_charge_id: string }>,
): {
  categoryBudgets: CategoryBudget[];
  rollingBudgets: RollingCategoryBudget[];
  multiMonthBudgets: MultiMonthBudget[];
} => {
  const categoryBudgets: CategoryBudget[] = [];
  const rollingBudgets: RollingCategoryBudget[] = [];
  const multiMonthBudgets: MultiMonthBudget[] = [];

  // Create a map of budget_id -> linked charge IDs
  const linksMap = new Map<string, string[]>();
  (budgetChargeLinks ?? []).forEach((link) => {
    const existing = linksMap.get(link.budget_id) ?? [];
    existing.push(link.recurring_charge_id);
    linksMap.set(link.budget_id, existing);
  });

  records.forEach((record) => {
    if (record.period === 'MONTHLY') {
      categoryBudgets.push({
        category: record.category,
        budget: record.amount,
        linkedCharges: linksMap.get(record.id),
      });
    } else if (record.period === 'ROLLING' && record.window_months !== null) {
      rollingBudgets.push({
        category: record.category,
        amount: record.amount,
        windowMonths: record.window_months,
      });
    } else if (
      record.period === 'MULTI' &&
      record.period_start !== null &&
      record.period_end !== null
    ) {
      multiMonthBudgets.push({
        category: record.category,
        amount: record.amount,
        periodStart: record.period_start,
        periodEnd: record.period_end,
      });
    }
  });

  return {
    categoryBudgets,
    rollingBudgets,
    multiMonthBudgets,
  };
};

/**
 * Batch conversion of transaction records
 */
export const supabaseTransactionsToEngine = (
  records: SupabaseTransactionRecord[],
): Transaction[] => records.map(supabaseTransactionToEngine);

/**
 * Batch conversion of recurring charge records
 */
export const supabaseRecurringChargesToEngine = (
  records: SupabaseRecurringChargeRecord[],
): RecurringCharge[] => records.map(supabaseRecurringChargeToEngine);

/**
 * Batch conversion of ceiling rule records
 */
export const supabaseCeilingRulesToEngine = (
  records: SupabaseCeilingRuleRecord[],
): CeilingRule[] => records.map(supabaseCeilingRuleToEngine);
