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

const activeRecurringCharges = (
  recurringCharges: RecurringCharge[],
  account: ProjectionInput['account'],
  month: string,
): { income: number; expenses: number } => {
  let income = 0;
  let expenses = 0;

  recurringCharges.forEach((charge) => {
    if (charge.account !== account) return;
    if (!isMonthInRange(month, charge.startMonth, charge.endMonth)) return;
    // Skip if this month is in the excluded months list
    if (charge.excludedMonths && charge.excludedMonths.includes(month)) return;

    if (charge.type === 'INCOME') {
      income += charge.amount;
    } else {
      expenses += charge.amount;
    }
  });

  return { income, expenses };
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

const buildCategoryBudgetResults = (
  budgets: CategoryBudget[],
  spending: Record<string, number>,
): CategoryBudgetResult[] =>
  budgets.map((budget) => {
    const spent = spending[budget.category] ?? 0;
    return {
      category: budget.category,
      budget: budget.budget,
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
    const categoryBudgetResults = buildCategoryBudgetResults(categoryBudgets, categorySpending);

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
