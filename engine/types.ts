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
  deferredUntil?: string; // YYYY-MM
  maxDeferralMonths?: number;
  priority?: number;
  category?: string;
}

export interface RecurringCharge {
  id: string;
  account: Account;
  type: TransactionType; // INCOME or EXPENSE
  amount: number;
  startMonth: string; // YYYY-MM
  endMonth?: string; // YYYY-MM
  excludedMonths?: string[]; // Array of YYYY-MM months to skip
}

export interface CeilingRule {
  id: string;
  account: Account;
  amount: number;
  startMonth: string; // YYYY-MM
  endMonth?: string; // YYYY-MM
}

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

export interface ProjectionInput {
  account: Account;
  initialBalance: number;
  transactions: Transaction[];
  recurringCharges: RecurringCharge[];
  startMonth: string; // YYYY-MM
  months: number;
  ceilingRules?: CeilingRule[];
  categoryBudgets?: CategoryBudget[];
  rollingBudgets?: RollingCategoryBudget[];
  multiMonthBudgets?: MultiMonthBudget[];
}

export interface CategoryBudget {
  category: string;
  budget: number;
}

export interface CategoryBudgetResult {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  status: BudgetStatus;
}

export interface MultiMonthBudget {
  category: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
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

export type TrendStatus = 'INCREASING' | 'DECREASING' | 'STABLE' | 'NO_HISTORY';

export interface CategoryBudgetTrendResult {
  category: string;
  current: number;
  previous: number;
  delta: number;
  percentChange: number;
  trend: TrendStatus;
}

export interface RollingCategoryBudget {
  category: string;
  amount: number;
  windowMonths: number;
}

export interface RollingCategoryBudgetResult {
  category: string;
  windowMonths: number;
  totalSpent: number;
  budgetAmount: number;
  ratio: number;
  status: 'OK' | 'WARNING' | 'REACHED' | 'EXCEEDED';
}

export type BudgetStatus = 'OK' | 'WARNING' | 'EXCEEDED';

export type EngineAlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export type EngineAlertType =
  | 'DEFICIT_STARTED'
  | 'DEFICIT_CARRIED'
  | 'DEFICIT_WORSENING'
  | 'DEFERRED_PENDING'
  | 'DEFERRED_FORCED'
  | 'DEFERRED_EXPIRED'
  | 'CEILING_REACHED'
  | 'CEILING_EXCEEDED'
  | 'CATEGORY_BUDGET_WARNING'
  | 'CATEGORY_BUDGET_EXCEEDED';

export interface EngineAlert {
  month: string; // YYYY-MM
  type: EngineAlertType;
  level: EngineAlertLevel;
  sourceModule: 'deficit' | 'deferred' | 'ceiling' | 'category-budget';
  metadata?: Record<string, unknown>;
}

export interface AnalysisResult {
  insights: string[];
}

export type AdvancedAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AdvancedAlertDomain = 'DEFICIT' | 'DEFERRED' | 'CEILING' | 'BUDGET' | 'TREND';

export interface AdvancedAlert {
  month: string; // YYYY-MM
  domain: AdvancedAlertDomain;
  category?: string;
  ruleId: string;
  groupId: string;
  severity: AdvancedAlertSeverity;
  metadata?: Record<string, unknown>;
  priorityRank: number;
}
