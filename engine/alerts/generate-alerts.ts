import { EngineAlert, EngineAlertLevel, EngineAlertType, MonthProjection } from '../types';

const makeAlert = (
  month: string,
  type: EngineAlertType,
  level: EngineAlertLevel,
  sourceModule: EngineAlert['sourceModule'],
  metadata?: Record<string, unknown>,
): EngineAlert => ({
  month,
  type,
  level,
  sourceModule,
  metadata,
});

export const generateAlerts = (projection: MonthProjection[]): EngineAlert[] => {
  const alerts: EngineAlert[] = [];

  projection.forEach((month, index) => {
    const { month: monthLabel } = month;
    const prevMonth = index > 0 ? projection[index - 1] : null;
    const previousBalance = prevMonth ? prevMonth.endingBalance : undefined;
    const previousDeficit = prevMonth && prevMonth.endingBalance < 0 ? Math.abs(prevMonth.endingBalance) : 0;
    const currentDeficit = month.endingBalance < 0 ? Math.abs(month.endingBalance) : 0;

    if (month.endingBalance < 0 && (previousBalance === undefined || previousBalance >= 0)) {
      alerts.push(
        makeAlert(
          monthLabel,
          'DEFICIT_STARTED',
          'CRITICAL',
          'deficit',
          { endingBalance: month.endingBalance },
        ),
      );
    }

    if (month.carriedOverDeficit > 0) {
      alerts.push(
        makeAlert(
          monthLabel,
          'DEFICIT_CARRIED',
          'WARNING',
          'deficit',
          { carriedOverDeficit: month.carriedOverDeficit },
        ),
      );
    }

    if (currentDeficit > previousDeficit && currentDeficit > 0) {
      alerts.push(
        makeAlert(
          monthLabel,
          'DEFICIT_WORSENING',
          'WARNING',
          'deficit',
          { endingBalance: month.endingBalance, previousDeficit },
        ),
      );
    }

    const statuses = month.deferredResolutions.reduce<Record<string, number>>((acc, resolution) => {
      acc[resolution.status] = (acc[resolution.status] ?? 0) + 1;
      return acc;
    }, {});

    if (statuses.PENDING) {
      alerts.push(
        makeAlert(
          monthLabel,
          'DEFERRED_PENDING',
          'INFO',
          'deferred',
          { count: statuses.PENDING },
        ),
      );
    }

    if (statuses.FORCED) {
      alerts.push(
        makeAlert(
          monthLabel,
          'DEFERRED_FORCED',
          'WARNING',
          'deferred',
          { count: statuses.FORCED },
        ),
      );
    }

    if (statuses.EXPIRED) {
      alerts.push(
        makeAlert(
          monthLabel,
          'DEFERRED_EXPIRED',
          'WARNING',
          'deferred',
          { count: statuses.EXPIRED },
        ),
      );
    }

    month.ceilings.forEach((ceiling) => {
      if (ceiling.state === 'REACHED') {
        alerts.push(
          makeAlert(
            monthLabel,
            'CEILING_REACHED',
            'WARNING',
            'ceiling',
            { ruleId: ceiling.ruleId, ceiling: ceiling.ceiling, outflow: ceiling.totalOutflow },
          ),
        );
      } else if (ceiling.state === 'EXCEEDED') {
        alerts.push(
          makeAlert(
            monthLabel,
            'CEILING_EXCEEDED',
            'CRITICAL',
            'ceiling',
            { ruleId: ceiling.ruleId, ceiling: ceiling.ceiling, outflow: ceiling.totalOutflow },
          ),
        );
      }
    });

    month.categoryBudgets.forEach((budget) => {
      if (budget.status === 'WARNING') {
        alerts.push(
          makeAlert(
            monthLabel,
            'CATEGORY_BUDGET_WARNING',
            'WARNING',
            'category-budget',
            { category: budget.category, budget: budget.budget, spent: budget.spent, status: budget.status },
          ),
        );
      } else if (budget.status === 'EXCEEDED') {
        alerts.push(
          makeAlert(
            monthLabel,
            'CATEGORY_BUDGET_EXCEEDED',
            'CRITICAL',
            'category-budget',
            { category: budget.category, budget: budget.budget, spent: budget.spent, status: budget.status },
          ),
        );
      }
    });
  });

  return alerts.sort((a, b) => {
    const monthComparison = a.month.localeCompare(b.month);
    if (monthComparison !== 0) return monthComparison;
    return a.type.localeCompare(b.type);
  });
};
