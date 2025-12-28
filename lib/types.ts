export type CeilingState = 'NOT_REACHED' | 'REACHED' | 'EXCEEDED';

export interface CeilingStatus {
  ruleId: string;
  month: string; // YYYY-MM
  ceiling: number;
  totalOutflow: number;
  state: CeilingState;
}

export type DeferredStatus = 'PENDING' | 'APPLIED' | 'FORCED' | 'EXPIRED';

export interface DeferredResolution {
  transactionId: string;
  month: string; // YYYY-MM
  amount: number;
  status: DeferredStatus;
  priority: number;
  forced: boolean;
  category?: string;
}

export type BudgetStatus = 'OK' | 'WARNING' | 'EXCEEDED';

export interface CategoryBudgetResult {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  status: BudgetStatus;
}

export type MultiMonthBudgetStatus = 'OK' | 'WARNING' | 'REACHED' | 'EXCEEDED' | 'INACTIVE';

export interface MultiMonthBudgetResult {
  category: string;
  periodStart: string;
  periodEnd: string;
  totalSpent: number;
  budgetAmount: number;
  ratio: number;
  status: MultiMonthBudgetStatus;
}

export interface RollingCategoryBudgetResult {
  category: string;
  windowMonths: number;
  totalSpent: number;
  budgetAmount: number;
  ratio: number;
  status: 'OK' | 'WARNING' | 'REACHED' | 'EXCEEDED';
}

export type TrendStatus = 'INCREASING' | 'DECREASING' | 'STABLE' | 'NO_HISTORY';

export interface CategoryBudgetTrendResult {
  category: string;
  current: number;
  previous: number;
  delta: number;
  percentChange: number;
  trend: TrendStatus;
}

export interface MonthlySummaryOutput {
  month: string;
  title: string;
  highlights: string[];
  details: string[];
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
  ceilings: CeilingStatus[];
  deferredResolutions: DeferredResolution[];
  categoryBudgets: CategoryBudgetResult[];
  categorySpending: Record<string, number>;
  multiMonthBudgets?: MultiMonthBudgetResult[];
  rollingBudgets?: RollingCategoryBudgetResult[];
  trends?: CategoryBudgetTrendResult[];
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AlertTextEntry {
  groupId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  priorityRank: number;
}

export interface EngineBalances {
  account: string;
  amount: number;
}

export interface EnginePayload {
  months: MonthProjection[];
  balances: EngineBalances[];
  categoryBudgets: CategoryBudgetResult[];
  rollingBudgets: RollingCategoryBudgetResult[];
  multiMonthBudgets: MultiMonthBudgetResult[];
  trends: CategoryBudgetTrendResult[];
  alertTexts: AlertTextEntry[];
}

export type EmptyStateReason = 'NO_TRANSACTIONS' | 'NO_DATA';

export interface EmptyStateOutput {
  isEmpty: boolean;
  emptyReason?: EmptyStateReason;
}

// =========================================
// DATABASE SCHEMA TYPES (Supabase tables)
// =========================================

export type Account = 'SG' | 'FLOA';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type BudgetPeriod = 'MONTHLY' | 'ROLLING' | 'MULTI';

/**
 * Transaction record from Supabase
 */
export interface SupabaseTransactionRecord {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  label: string;
  amount: number;
  category: string | null;
  account: Account;
  type: TransactionType;
  is_deferred: boolean;
  deferred_to: string | null; // YYYY-MM
  deferred_until: string | null; // YYYY-MM
  max_deferral_months: number | null;
  priority: number;
  created_at?: string;
}

/**
 * Recurring charge record from Supabase
 */
export interface SupabaseRecurringChargeRecord {
  id: string;
  user_id: string;
  account: Account;
  type: TransactionType; // INCOME or EXPENSE
  label: string;
  amount: number;
  start_month: string; // YYYY-MM
  end_month: string | null; // YYYY-MM
  excluded_months?: string[]; // Array of YYYY-MM months to skip
  monthly_overrides?: Record<string, number>; // Custom amounts for specific months {"2025-12": 150}
  created_at?: string;
}

/**
 * Ceiling rule record from Supabase
 */
export interface SupabaseCeilingRuleRecord {
  id: string;
  user_id: string;
  account: Account;
  label: string;
  amount: number;
  start_month: string; // YYYY-MM
  end_month: string | null; // YYYY-MM
  created_at?: string;
}

/**
 * Budget record from Supabase (updated schema)
 */
export interface SupabaseBudgetRecord {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string | null; // DATE for MONTHLY budgets
  end_date: string | null; // DATE for MONTHLY budgets
  window_months: number | null; // For ROLLING budgets (e.g., 3)
  period_start: string | null; // YYYY-MM for MULTI budgets
  period_end: string | null; // YYYY-MM for MULTI budgets
  created_at?: string;
}

/**
 * Account balance record from Supabase
 */
export interface SupabaseAccountBalanceRecord {
  id: string;
  user_id: string;
  account: Account;
  month: string; // YYYY-MM
  opening_balance: number;
  created_at?: string;
}
