import {
  CategoryBudgetResult,
  CategoryBudgetTrendResult,
  MonthProjection,
  TrendStatus,
} from '../types';

const STABLE_THRESHOLD = 0.05;

const computePercentChange = (delta: number, previous: number): number => {
  if (previous === 0) {
    if (delta === 0) {
      return 0;
    }
    return delta > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }

  return delta / previous;
};

const determineTrendStatus = (percentChange: number): TrendStatus => {
  if (!Number.isFinite(percentChange)) {
    return percentChange > 0 ? 'INCREASING' : 'DECREASING';
  }
  if (Math.abs(percentChange) <= STABLE_THRESHOLD) {
    return 'STABLE';
  }
  return percentChange > 0 ? 'INCREASING' : 'DECREASING';
};

const findPreviousBudgetResult = (
  history: MonthProjection[],
  category: string,
): CategoryBudgetResult | undefined => {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const result = history[index].categoryBudgets.find((budget) => budget.category === category);
    if (result) {
      return result;
    }
  }
  return undefined;
};

export const evaluateBudgetTrends = (
  currentMonth: MonthProjection,
  history: MonthProjection[],
): CategoryBudgetTrendResult[] => {
  return currentMonth.categoryBudgets.map((currentBudget) => {
    const previousBudget = findPreviousBudgetResult(history, currentBudget.category);

    if (!previousBudget) {
      return {
        category: currentBudget.category,
        current: currentBudget.spent,
        previous: 0,
        delta: currentBudget.spent,
        percentChange: 0,
        trend: 'NO_HISTORY',
      };
    }

    const delta = currentBudget.spent - previousBudget.spent;
    const percentChange = computePercentChange(delta, previousBudget.spent);
    const trend = determineTrendStatus(percentChange);

    return {
      category: currentBudget.category,
      current: currentBudget.spent,
      previous: previousBudget.spent,
      delta,
      percentChange,
      trend,
    };
  });
};
