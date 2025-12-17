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
