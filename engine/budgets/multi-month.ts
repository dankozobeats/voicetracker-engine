import { MonthProjection, MultiMonthBudget, MultiMonthBudgetResult, MultiMonthBudgetStatus } from '../types';
import { monthIndex } from '../utils/date';

const determineMultiMonthStatus = (ratio: number): MultiMonthBudgetStatus => {
  if (ratio > 1) {
    return 'EXCEEDED';
  }
  if (ratio === 1) {
    return 'REACHED';
  }
  if (ratio >= 0.8) {
    return 'WARNING';
  }
  return 'OK';
};

export const evaluateMultiMonthBudgets = (
  currentMonth: MonthProjection,
  history: MonthProjection[],
  budgets: MultiMonthBudget[],
): MultiMonthBudgetResult[] => {
  if (!budgets.length) {
    return [];
  }

  const timeline = [...history, currentMonth];
  const currentIndex = monthIndex(currentMonth.month);

  return budgets.map((budget) => {
    const startIndex = monthIndex(budget.periodStart);
    const endIndex = monthIndex(budget.periodEnd);

    if (currentIndex < startIndex || currentIndex > endIndex) {
      return {
        category: budget.category,
        periodStart: budget.periodStart,
        periodEnd: budget.periodEnd,
        totalSpent: 0,
        budgetAmount: budget.amount,
        ratio: 0,
        status: 'INACTIVE',
      };
    }

    const relevantMonths = timeline.filter((month) => {
      const index = monthIndex(month.month);
      return index >= startIndex && index <= Math.min(currentIndex, endIndex);
    });

    const totalSpent = relevantMonths.reduce((sum, month) => {
      return sum + (month.categorySpending[budget.category] ?? 0);
    }, 0);

    const budgetAmount = budget.amount;
    const ratio =
      budgetAmount === 0 ? (totalSpent > 0 ? Number.POSITIVE_INFINITY : 0) : totalSpent / budgetAmount;
    const status = determineMultiMonthStatus(ratio);

    return {
      category: budget.category,
      periodStart: budget.periodStart,
      periodEnd: budget.periodEnd,
      totalSpent,
      budgetAmount,
      ratio,
      status,
    };
  });
};
