import { MonthProjection } from './types';

export const applyDeficitCarryOver = (
  previousMonth: MonthProjection | null,
  currentMonth: MonthProjection,
): MonthProjection => {
  const carriedOverDeficit =
    previousMonth && previousMonth.endingBalance < 0 ? Math.abs(previousMonth.endingBalance) : 0;

  const endingBalance =
    currentMonth.openingBalance +
    currentMonth.income -
    currentMonth.expenses -
    currentMonth.fixedCharges +
    currentMonth.deferredIn -
    carriedOverDeficit;

  return {
    ...currentMonth,
    carriedOverDeficit,
    endingBalance,
  };
};
