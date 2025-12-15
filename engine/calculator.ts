import { ProjectionInput, MonthProjection, RecurringCharge, Transaction } from './types';
import { applyDeficitCarryOver } from './deficit-handler';
import { addMonths, monthFromDate, isMonthInRange } from './utils/date';

/**
 * Expenses are recorded either as negative deductions or positive costs.
 * This helper always returns a positive amount because the projection engine
 * treats every expense as a positive cost; that normalization is central to
 * keeping the monthly calculations consistent.
 */
export const normalizeExpenseAmount = (amount: number): number => Math.abs(amount);

const summarizeDeferredByMonth = (
  transactions: Transaction[],
  account: ProjectionInput['account'],
): Record<string, number> => {
  return transactions.reduce<Record<string, number>>((carry, transaction) => {
    if (
      transaction.account !== account ||
      transaction.type !== 'EXPENSE' ||
      !transaction.isDeferred ||
      !transaction.deferredTo
    ) {
      return carry;
    }

    carry[transaction.deferredTo] = (carry[transaction.deferredTo] ?? 0) + transaction.amount;
    return carry;
  }, {});
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

export const calculateProjection = (input: ProjectionInput): MonthProjection[] => {
  const { account, initialBalance, transactions, recurringCharges, startMonth, months } = input;
  if (months <= 0) return [];

  const accountTransactions = transactions.filter((t) => t.account === account);
  const deferredSchedule = summarizeDeferredByMonth(accountTransactions, account);

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
    const deferredIn = deferredSchedule[monthLabel] ?? 0;

    const baseMonth: MonthProjection = {
      month: monthLabel,
      openingBalance,
      income,
      expenses,
      fixedCharges,
      deferredIn,
      carriedOverDeficit: 0,
      endingBalance: 0,
    };

    const resolvedMonth = applyDeficitCarryOver(previousMonth, baseMonth);
    projections.push(resolvedMonth);

    // Le solde final d’un mois devient systématiquement l’ouverture du mois suivant.
    openingBalance = resolvedMonth.endingBalance;
    previousMonth = resolvedMonth;
  }

  return projections;
};
