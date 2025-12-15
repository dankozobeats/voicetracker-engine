const toIndex = (month: string): number => {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthNumber = Number(monthStr);
  return year * 12 + monthNumber - 1;
};

const fromIndex = (index: number): string => {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
};

export const addMonths = (baseMonth: string, offset: number): string => {
  return fromIndex(toIndex(baseMonth) + offset);
};

export const monthFromDate = (date: string): string => {
  return date.slice(0, 7);
};

export const isMonthInRange = (month: string, startMonth: string, endMonth?: string): boolean => {
  if (month < startMonth) {
    return false;
  }
  if (endMonth && month > endMonth) {
    return false;
  }
  return true;
};
