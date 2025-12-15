export type Account = 'SG' | 'FLOA';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  account: Account;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  isDeferred?: boolean;
  deferredTo?: string; // YYYY-MM
}

export interface RecurringCharge {
  id: string;
  account: Account;
  amount: number;
  startMonth: string; // YYYY-MM
  endMonth?: string; // YYYY-MM
}

export interface MonthProjection {
  month: string; // YYYY-MM
  openingBalance: number;
  income: number;
  expenses: number;
  fixedCharges: number;
  deferredIn: number;
  carriedOverDeficit: number;
  endingBalance: number;
}

export interface ProjectionInput {
  account: Account;
  initialBalance: number;
  transactions: Transaction[];
  recurringCharges: RecurringCharge[];
  startMonth: string; // YYYY-MM
  months: number;
}
