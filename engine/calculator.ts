import {
  BudgetStatus,
  CategoryBudget,
  CategoryBudgetResult,
  CeilingRule,
  CeilingState,
  CeilingStatus,
  DeferredResolution,
  DeferredStatus,
  MonthProjection,
  ProjectionInput,
  RecurringCharge,
  RecurringChargeBreakdownItem,
  Transaction,
} from './types';
import { applyDeficitCarryOver } from './deficit-handler';
import { evaluateRollingBudgets } from './budgets/rolling';
import { evaluateMultiMonthBudgets } from './budgets/multi-month';
import { evaluateBudgetTrends } from './budgets/trends';
import { addMonths, isMonthInRange, monthFromDate, monthIndex } from './utils/date';

/**
 * Expenses are recorded either as negative deductions or positive costs.
 * This helper always returns a positive amount because the projection engine
 * treats every expense as a positive cost.
 */
export const normalizeExpenseAmount = (amount: number): number => Math.abs(amount);

const WARNING_THRESHOLD = 0.8;
const EXCEEDED_THRESHOLD = 1.0;

/**
 * Returns only transactions explicitly marked as deferred.
 * Transactions are treated as immutable inputs.
 */
const getDeferredTransactions = (transactions: Transaction[]): Transaction[] =>
  transactions.filter((transaction) => transaction.isDeferred === true);

/**
 * Determines whether a deferred transaction should apply for a given month.
 * This function derives all deferred-related metadata without mutating inputs.
 */
const shouldApplyDeferred = (
  transaction: Transaction,
  currentMonth: string,
): {
  shouldApply: boolean;
  forced: boolean;
  deferredUntil: string;
  priority: number;
} => {
  const deferredUntil =
    transaction.deferredUntil ??
    transaction.deferredTo ??
    monthFromDate(transaction.date);

  const priority = transaction.priority ?? 9;

  const currentIndex = monthIndex(currentMonth);
  const targetIndex = monthIndex(deferredUntil);

  const forced =
    transaction.maxDeferralMonths !== undefined &&
    currentIndex - targetIndex > transaction.maxDeferralMonths;

  return {
    shouldApply: forced || currentIndex >= targetIndex,
    forced,
    deferredUntil,
    priority,
  };
};

/**
 * Computes deferred resolutions for the current month.
 * Fully deterministic, no mutation, no hidden state.
 */
const collectDeferredResolutions = (
  deferredTransactions: Transaction[],
  currentMonth: string,
): {
  totalOutflow: number;
  totalSigned: number;
  resolutions: DeferredResolution[];
} => {
  const eligible = deferredTransactions
    .map((transaction) => {
      const decision = shouldApplyDeferred(transaction, currentMonth);
      return { transaction, decision };
    })
    .filter(({ decision }) => decision.shouldApply)
    .sort((a, b) => a.decision.priority - b.decision.priority);

  let totalOutflow = 0;
  let totalSigned = 0;

  const resolutions: DeferredResolution[] = eligible.map(({ transaction, decision }) => {
    const amount = normalizeExpenseAmount(transaction.amount);
    const status: DeferredStatus = decision.forced ? 'FORCED' : 'APPLIED';

    totalOutflow += amount;
    totalSigned += transaction.amount;

    return {
      transactionId: transaction.id,
      month: currentMonth,
      amount,
      status,
      priority: decision.priority,
      forced: decision.forced,
      category: transaction.category,
    };
  });

  return { totalOutflow, totalSigned, resolutions };
};

const monthlyTransactions = (transactions: Transaction[], month: string): Transaction[] =>
  transactions.filter((transaction) => monthFromDate(transaction.date) === month);

/**
 * Finds the most recent override amount that applies to the given month.
 * If an override exists for the exact month, use it.
 * Otherwise, use the last chronologically defined override before this month.
 * Falls back to the base amount if no overrides are defined.
 */
const getEffectiveAmount = (
  charge: RecurringCharge,
  month: string,
): number => {
  if (!charge.monthlyOverrides || Object.keys(charge.monthlyOverrides).length === 0) {
    return charge.amount;
  }

  // Check for exact match first
  if (charge.monthlyOverrides[month] !== undefined) {
    return charge.monthlyOverrides[month];
  }

  // Find all overrides before or equal to current month, sorted chronologically
  const applicableOverrides = Object.entries(charge.monthlyOverrides)
    .filter(([overrideMonth]) => overrideMonth <= month)
    .sort(([a], [b]) => b.localeCompare(a)); // Descending order (most recent first)

  // Use the most recent override, or fall back to base amount
  return applicableOverrides.length > 0 ? applicableOverrides[0][1] : charge.amount;
};

const activeRecurringCharges = (
  recurringCharges: RecurringCharge[],
  account: ProjectionInput['account'],
  month: string,
): { income: number; expenses: number; breakdown: RecurringChargeBreakdownItem[] } => {
  let income = 0;
  let expenses = 0;
  const breakdown: RecurringChargeBreakdownItem[] = [];

  recurringCharges.forEach((charge) => {
    if (charge.account !== account) return;
    if (!isMonthInRange(month, charge.startMonth, charge.endMonth)) return;
    // Skip if this month is in the excluded months list
    if (charge.excludedMonths && charge.excludedMonths.includes(month)) return;

    // Use the effective amount (last override or base amount)
    const amount = getEffectiveAmount(charge, month);

    breakdown.push({
      chargeId: charge.id,
      label: charge.label,
      amount,
      type: charge.type,
      purpose: charge.purpose ?? 'REGULAR',
    });

    if (charge.type === 'INCOME') {
      income += amount;
    } else {
      expenses += amount;
    }
  });

  return { income, expenses, breakdown };
};

const ceilingStateFor = (limit: number, totalOutflow: number): CeilingState => {
  if (totalOutflow < limit) return 'NOT_REACHED';
  if (totalOutflow === limit) return 'REACHED';
  return 'EXCEEDED';
};

const activeCeilingRules = (
  ceilingRules: CeilingRule[],
  account: ProjectionInput['account'],
  month: string,
): CeilingRule[] =>
  ceilingRules.filter(
    (rule) => rule.account === account && isMonthInRange(month, rule.startMonth, rule.endMonth),
  );

const buildCeilingStatuses = (
  ceilingRules: CeilingRule[],
  month: string,
  totalOutflow: number,
): CeilingStatus[] =>
  ceilingRules.map((rule) => ({
    ruleId: rule.id,
    month,
    ceiling: rule.amount,
    totalOutflow,
    state: ceilingStateFor(rule.amount, totalOutflow),
  }));

const accumulateCategorySpending = (
  bucket: Record<string, number>,
  category: string,
  amount: number,
) => {
  bucket[category] = (bucket[category] ?? 0) + amount;
};

const buildMonthlyCategorySpending = (
  monthTx: Transaction[],
  deferredResolutions: DeferredResolution[],
): Record<string, number> => {
  const bucket: Record<string, number> = {};

  monthTx
    .filter((t) => t.type === 'EXPENSE' && !t.isDeferred)
    .forEach((t) => {
      if (t.category) {
        accumulateCategorySpending(bucket, t.category, normalizeExpenseAmount(t.amount));
      }
    });

  deferredResolutions.forEach((resolution) => {
    if (resolution.category) {
      accumulateCategorySpending(bucket, resolution.category, resolution.amount);
    }
  });

  return bucket;
};

const determineBudgetStatus = (budget: number, spent: number): BudgetStatus => {
  if (spent > budget * EXCEEDED_THRESHOLD) return 'EXCEEDED';
  if (spent >= budget * WARNING_THRESHOLD) return 'WARNING';
  return 'OK';
};

/**
 * Check if a recurring charge is active for a given month
 */
const isChargeActiveForMonth = (charge: RecurringCharge, month: string): boolean => {
  if (!isMonthInRange(month, charge.startMonth, charge.endMonth)) return false;
  if (charge.excludedMonths?.includes(month)) return false;
  return true;
};

const buildCategoryBudgetResults = (
  budgets: CategoryBudget[],
  spending: Record<string, number>,
  recurringCharges: RecurringCharge[],
  currentMonth: string,
): CategoryBudgetResult[] =>
  budgets.map((budget) => {
    // Calculate fixed charges (linked recurring charges for this budget)
    const linkedChargeIds = budget.linkedCharges ?? [];
    const fixedCharges = linkedChargeIds.reduce((sum, chargeId) => {
      const charge = recurringCharges.find((c) => c.id === chargeId);
      if (!charge || charge.type !== 'EXPENSE') return sum;

      // Check if charge is active for this month
      if (!isChargeActiveForMonth(charge, currentMonth)) return sum;

      // Get the amount (with monthly override if present)
      const amount = getEffectiveAmount(charge, currentMonth);
      return sum + Math.abs(amount);
    }, 0);

    // Variable spending from transactions
    const variableSpent = spending[budget.category] ?? 0;

    // Total spent = fixed charges + variable spending
    const spent = fixedCharges + variableSpent;

    return {
      category: budget.category,
      budget: budget.budget,
      fixedCharges,
      variableSpent,
      spent,
      remaining: budget.budget - spent,
      status: determineBudgetStatus(budget.budget, spent),
    };
  });

export const calculateProjection = (input: ProjectionInput): MonthProjection[] => {
  const {
    account,
    initialBalance,
    transactions,
    recurringCharges,
    startMonth,
    months,
    ceilingRules = [],
    categoryBudgets = [],
    rollingBudgets = [],
    multiMonthBudgets = [],
  } = input;

  if (months <= 0) return [];

  const accountTransactions = transactions.filter((t) => t.account === account);
  const deferredTransactions = getDeferredTransactions(accountTransactions);

  const projections: MonthProjection[] = [];
  let previousMonth: MonthProjection | null = null;
  let openingBalance = initialBalance;

  for (let offset = 0; offset < months; offset += 1) {
    const monthLabel = addMonths(startMonth, offset);
    const monthTx = monthlyTransactions(accountTransactions, monthLabel);

    const transactionIncome = monthTx
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const transactionExpenses = monthTx
      .filter((t) => t.type === 'EXPENSE' && !t.isDeferred)
      .reduce((sum, t) => sum + normalizeExpenseAmount(t.amount), 0);

    const recurringChargeAmounts = activeRecurringCharges(recurringCharges, account, monthLabel);

    const income = transactionIncome + recurringChargeAmounts.income;
    const expenses = transactionExpenses;
    const fixedCharges = recurringChargeAmounts.expenses;

    const {
      totalOutflow: deferredOutflow,
      totalSigned: deferredIn,
      resolutions: deferredResolutions,
    } = collectDeferredResolutions(deferredTransactions, monthLabel);

    const categorySpending = buildMonthlyCategorySpending(monthTx, deferredResolutions);
    const categoryBudgetResults = buildCategoryBudgetResults(
      categoryBudgets,
      categorySpending,
      recurringCharges,
      monthLabel,
    );

    const totalOutflow = expenses + fixedCharges + deferredOutflow;
    const ceilingStatuses = buildCeilingStatuses(
      activeCeilingRules(ceilingRules, account, monthLabel),
      monthLabel,
      totalOutflow,
    );

    const baseMonth: MonthProjection = {
      month: monthLabel,
      openingBalance,
      income,
      expenses,
      fixedCharges,
      deferredIn,
      carriedOverDeficit: 0,
      endingBalance: 0,
      ceilings: ceilingStatuses,
      deferredResolutions,
      recurringChargeBreakdown: recurringChargeAmounts.breakdown,
      categoryBudgets: categoryBudgetResults,
      categorySpending,
    };

    const resolvedMonth = applyDeficitCarryOver(previousMonth, baseMonth);

    const rollingResults = evaluateRollingBudgets(resolvedMonth, projections, rollingBudgets);
    const monthWithRolling: MonthProjection = {
      ...resolvedMonth,
      rollingBudgets: rollingResults,
    };

    const multiMonthResults = evaluateMultiMonthBudgets(
      monthWithRolling,
      projections,
      multiMonthBudgets,
    );
    const finalizedMonth: MonthProjection = {
      ...monthWithRolling,
      multiMonthBudgets: multiMonthResults,
    };

    const trendResults = evaluateBudgetTrends(finalizedMonth, projections);
    const monthWithTrends: MonthProjection = {
      ...finalizedMonth,
      trends: trendResults,
    };

    projections.push(monthWithTrends);

    openingBalance = monthWithTrends.endingBalance;
    previousMonth = monthWithTrends;
  }

  return projections;
};
