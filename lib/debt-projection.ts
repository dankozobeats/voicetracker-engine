/**
 * DEBT PROJECTION ENGINE
 *
 * Calculates month-by-month debt projections including:
 * - Remaining balance reduction
 * - Interest accrual (if applicable)
 * - Payment schedules with overrides and exclusions
 * - Payoff date estimation
 */

export interface DebtData {
  id: string;
  label: string;
  monthlyPayment: number;
  remainingBalance: number;
  initialBalance?: number | null;
  interestRate?: number | null; // Annual rate as percentage (e.g., 5.5 for 5.5%)
  startMonth: string; // YYYY-MM
  endMonth?: string | null; // YYYY-MM
  excludedMonths?: string[]; // Months where payment is suspended
  monthlyOverrides?: Record<string, number>; // Extra/different payments
  debtStartDate?: string | null; // YYYY-MM-DD
}

export interface MonthlyDebtProjection {
  month: string; // YYYY-MM
  openingBalance: number;
  payment: number;
  interestCharge: number;
  principalPayment: number;
  closingBalance: number;
  isExcluded: boolean;
  isOverride: boolean;
}

export interface DebtProjectionResult {
  debt: DebtData;
  projections: MonthlyDebtProjection[];
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  totalPaid: number;
  estimatedPayoffMonth: string | null; // YYYY-MM when balance reaches 0
  monthsRemaining: number | null;
}

/**
 * Add months to a YYYY-MM string
 */
function addMonths(monthStr: string, count: number): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + count);
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

/**
 * Calculate monthly interest charge
 */
function calculateMonthlyInterest(balance: number, annualRate: number): number {
  if (!annualRate || annualRate <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  return balance * monthlyRate;
}

/**
 * Project a single debt over a specified number of months
 */
export function projectDebt(
  debt: DebtData,
  projectionMonths: number = 72
): DebtProjectionResult {
  const projections: MonthlyDebtProjection[] = [];
  let currentBalance = debt.remainingBalance;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let payoffMonth: string | null = null;

  const excludedSet = new Set(debt.excludedMonths ?? []);
  const overrides = debt.monthlyOverrides ?? {};

  for (let i = 0; i < projectionMonths; i++) {
    const month = addMonths(debt.startMonth, i);

    // Check if we've already paid off the debt
    if (currentBalance <= 0) {
      if (!payoffMonth) {
        payoffMonth = i > 0 ? addMonths(debt.startMonth, i - 1) : debt.startMonth;
      }
      break;
    }

    // Check if we've reached the end month
    if (debt.endMonth && month > debt.endMonth) {
      break;
    }

    const openingBalance = currentBalance;
    const isExcluded = excludedSet.has(month);
    const isOverride = month in overrides;

    let payment = 0;
    let interestCharge = 0;
    let principalPayment = 0;

    if (!isExcluded) {
      // Calculate interest first
      interestCharge = calculateMonthlyInterest(openingBalance, debt.interestRate ?? 0);

      // Determine payment amount
      payment = isOverride ? overrides[month] : debt.monthlyPayment;

      // Principal payment is what's left after interest
      principalPayment = Math.max(0, payment - interestCharge);

      // Ensure we don't overpay
      if (principalPayment > openingBalance) {
        principalPayment = openingBalance;
        payment = principalPayment + interestCharge;
      }

      // Update totals
      totalInterestPaid += interestCharge;
      totalPrincipalPaid += principalPayment;
      currentBalance = openingBalance - principalPayment;
    }

    projections.push({
      month,
      openingBalance,
      payment,
      interestCharge,
      principalPayment,
      closingBalance: currentBalance,
      isExcluded,
      isOverride,
    });
  }

  // If debt still has balance after all projections, we haven't found payoff date
  if (currentBalance > 0) {
    payoffMonth = null;
  }

  const monthsRemaining = payoffMonth
    ? projections.findIndex((p) => p.month === payoffMonth) + 1
    : null;

  return {
    debt,
    projections,
    totalInterestPaid,
    totalPrincipalPaid,
    totalPaid: totalInterestPaid + totalPrincipalPaid,
    estimatedPayoffMonth: payoffMonth,
    monthsRemaining,
  };
}

/**
 * Project multiple debts and return consolidated results
 */
export function projectMultipleDebts(
  debts: DebtData[],
  projectionMonths: number = 72
): DebtProjectionResult[] {
  return debts.map((debt) => projectDebt(debt, projectionMonths));
}

/**
 * Calculate aggregate statistics across all debts
 */
export interface AggregateDebtStats {
  totalRemainingBalance: number;
  totalMonthlyPayment: number;
  totalProjectedInterest: number;
  totalProjectedPayment: number;
  averageMonthsRemaining: number | null;
  earliestPayoffMonth: string | null;
  latestPayoffMonth: string | null;
}

export function calculateAggregateStats(
  results: DebtProjectionResult[]
): AggregateDebtStats {
  const totalRemainingBalance = results.reduce(
    (sum, r) => sum + r.debt.remainingBalance,
    0
  );

  const totalMonthlyPayment = results.reduce(
    (sum, r) => sum + r.debt.monthlyPayment,
    0
  );

  const totalProjectedInterest = results.reduce(
    (sum, r) => sum + r.totalInterestPaid,
    0
  );

  const totalProjectedPayment = results.reduce(
    (sum, r) => sum + r.totalPaid,
    0
  );

  const payoffMonths = results
    .map((r) => r.estimatedPayoffMonth)
    .filter((m): m is string => m !== null);

  const monthsRemainingValues = results
    .map((r) => r.monthsRemaining)
    .filter((m): m is number => m !== null);

  const averageMonthsRemaining =
    monthsRemainingValues.length > 0
      ? monthsRemainingValues.reduce((sum, m) => sum + m, 0) / monthsRemainingValues.length
      : null;

  const earliestPayoffMonth =
    payoffMonths.length > 0 ? payoffMonths.sort()[0] : null;

  const latestPayoffMonth =
    payoffMonths.length > 0 ? payoffMonths.sort().reverse()[0] : null;

  return {
    totalRemainingBalance,
    totalMonthlyPayment,
    totalProjectedInterest,
    totalProjectedPayment,
    averageMonthsRemaining,
    earliestPayoffMonth,
    latestPayoffMonth,
  };
}
