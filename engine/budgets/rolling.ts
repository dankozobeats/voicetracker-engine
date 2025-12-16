import { MonthProjection, RollingCategoryBudget, RollingCategoryBudgetResult } from '../types';

const determineStatus = (ratio: number): RollingCategoryBudgetResult['status'] => {
  if (ratio >= 1) {
    return ratio === 1 ? 'REACHED' : 'EXCEEDED';
  }
  if (ratio >= 0.8) {
    return 'WARNING';
  }
  return 'OK';
};

export const evaluateRollingBudgets = (
  currentMonth: MonthProjection,
  history: MonthProjection[],
  budgets: RollingCategoryBudget[],
): RollingCategoryBudgetResult[] => {
  return budgets.map((budget) => {
    const window = Math.max(1, budget.windowMonths);
    const relevant = [...history, currentMonth];
    const windowSlice = relevant.slice(-window);

    const totalSpent = windowSlice.reduce((sum, month) => {
      const spend = month.categorySpending[budget.category] ?? 0;
      return sum + spend;
    }, 0);

    const ratio = budget.amount > 0 ? totalSpent / budget.amount : 0;

    return {
      category: budget.category,
      windowMonths: window,
      totalSpent,
      budgetAmount: budget.amount,
      ratio,
      status: determineStatus(ratio),
    };
  });
};
