import {
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

export const calculateProjection = (input: ProjectionInput): MonthProjection[] => {
  const {
    account,
    initialBalance,
    transactions,
    recurringCharges,
    startMonth,
    months,
    ceilingRules = [],
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
    };

    const resolvedMonth = applyDeficitCarryOver(previousMonth, baseMonth);
    projections.push(resolvedMonth);

    // Le solde final d’un mois devient systématiquement l’ouverture du mois suivant.
    openingBalance = resolvedMonth.endingBalance;
    previousMonth = resolvedMonth;
  }

  return projections;
};
