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
 * treats every expense as a positive cost; that normalization is central to
 * keeping the monthly calculations consistent.
 */
export const normalizeExpenseAmount = (amount: number): number => Math.abs(amount);

interface PendingDeferred extends Transaction {
  deferredStatus: DeferredStatus;
  deferredUntil: string;
  priority: number;
}

const buildPendingDeferreds = (transactions: Transaction[]): PendingDeferred[] =>
  transactions
    .filter((transaction) => transaction.isDeferred)
    .map((transaction) => ({
      ...transaction,
      deferredStatus: transaction.deferredStatus ?? 'PENDING',
      priority: transaction.priority ?? 9,
      deferredUntil: transaction.deferredUntil ?? transaction.deferredTo ?? monthFromDate(transaction.date),
    }));

const WARNING_THRESHOLD = 0.8;
const EXCEEDED_THRESHOLD = 1.0;

const shouldApplyDeferred = (
  deferred: PendingDeferred,
  currentMonth: string,
): { shouldApply: boolean; forced: boolean } => {
  const currentIndex = monthIndex(currentMonth);
  const targetIndex = monthIndex(deferred.deferredUntil);
  const forced =
    deferred.maxDeferralMonths !== undefined &&
    currentIndex - targetIndex > deferred.maxDeferralMonths;

  return {
    shouldApply: forced || currentIndex >= targetIndex,
    forced,
  };
};

const collectDeferredResolutions = (
  pendingDeferreds: PendingDeferred[],
  currentMonth: string,
): { totalOutflow: number; totalSigned: number; resolutions: DeferredResolution[] } => {
  const eligible = pendingDeferreds
    .filter((deferred) => deferred.deferredStatus === 'PENDING')
    .map((deferred) => ({
      deferred,
      decision: shouldApplyDeferred(deferred, currentMonth),
    }))
    .filter(({ decision }) => decision.shouldApply)
    .sort((a, b) => a.deferred.priority - b.deferred.priority);

  let totalOutflow = 0;
  let totalSigned = 0;
  const resolutions = eligible.map(({ deferred, decision }) => {
    const status: DeferredStatus = decision.forced ? 'FORCED' : 'APPLIED';
    deferred.deferredStatus = status;
    const amount = normalizeExpenseAmount(deferred.amount);
    totalOutflow += amount;
    totalSigned += deferred.amount;

    return {
      transactionId: deferred.id,
      month: currentMonth,
      amount,
      status,
      priority: deferred.priority,
      forced: decision.forced,
      category: deferred.category,
    };
  });

  return { totalOutflow, totalSigned, resolutions };
};

const monthlyTransactions = (transactions: Transaction[], month: string): Transaction[] =>
  transactions.filter((transaction) => monthFromDate(transaction.date) === month);

const activeFixedCharges = (
  recurringCharges: RecurringCharge[],
  account: ProjectionInput['account'],
  month: string,
): number =>
  recurringCharges.reduce((total, charge) => {
    if (charge.account !== account) return total;
    if (!isMonthInRange(month, charge.startMonth, charge.endMonth)) return total;
    return total + charge.amount;
  }, 0);

const ceilingStateFor = (limit: number, totalOutflow: number): CeilingState => {
  if (totalOutflow < limit) {
    return 'NOT_REACHED';
  }
  if (totalOutflow === limit) {
    return 'REACHED';
  }
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

const categorizeAmount = (category?: string, amount?: number): string | undefined => {
  return category && amount !== undefined ? category : undefined;
};

const accumulateCategorySpending = (bucket: Record<string, number>, category: string, amount: number) => {
  bucket[category] = (bucket[category] ?? 0) + amount;
};

const buildMonthlyCategorySpending = (
  monthTx: Transaction[],
  deferredResolutions: DeferredResolution[],
): Record<string, number> => {
  const bucket: Record<string, number> = {};

  monthTx
    .filter((transaction) => transaction.type === 'EXPENSE' && !transaction.isDeferred)
    .forEach((transaction) => {
      const category = categorizeAmount(transaction.category, transaction.amount);
      if (category) {
        accumulateCategorySpending(bucket, category, normalizeExpenseAmount(transaction.amount));
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
  if (spent > budget * EXCEEDED_THRESHOLD) {
    return 'EXCEEDED';
  }
  if (spent >= budget * WARNING_THRESHOLD) {
    return 'WARNING';
  }
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
  const pendingDeferreds = buildPendingDeferreds(accountTransactions);

  const projections: MonthProjection[] = [];
  let previousMonth: MonthProjection | null = null;
  let openingBalance = initialBalance;

  for (let offset = 0; offset < months; offset += 1) {
    const monthLabel = addMonths(startMonth, offset);
    const monthTx = monthlyTransactions(accountTransactions, monthLabel);

    const income = monthTx
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    /**
     * Expenses may come in with either sign, but the engine consistently treats
     * them as positive costs to ensure the monthly deficit logic remains stable.
     */
    const expenses = monthTx
      .filter((t) => t.type === 'EXPENSE' && !t.isDeferred)
      .reduce((sum, t) => sum + normalizeExpenseAmount(t.amount), 0);

    const fixedCharges = activeFixedCharges(recurringCharges, account, monthLabel);
    const {
      totalOutflow: deferredOutflow,
      totalSigned: deferredIn,
      resolutions: deferredResolutions,
    } = collectDeferredResolutions(pendingDeferreds, monthLabel);

    const currentCategorySpending = buildMonthlyCategorySpending(monthTx, deferredResolutions);
    const categoryBudgetsResults = buildCategoryBudgetResults(
      categoryBudgets ?? [],
      currentCategorySpending,
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
      categoryBudgets: categoryBudgetsResults,
      categorySpending: currentCategorySpending,
    };

    const resolvedMonth = applyDeficitCarryOver(previousMonth, baseMonth);
    const rollingResults = evaluateRollingBudgets(resolvedMonth, projections, rollingBudgets ?? []);
    const monthWithRolling: MonthProjection = {
      ...resolvedMonth,
      rollingBudgets: rollingResults,
    };
    const multiMonthResults = evaluateMultiMonthBudgets(
      monthWithRolling,
      projections,
      multiMonthBudgets ?? [],
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

    // Le solde final d’un mois devient systématiquement l’ouverture du mois suivant.
    openingBalance = monthWithTrends.endingBalance;
    previousMonth = monthWithTrends;
  }

  return projections;
};
