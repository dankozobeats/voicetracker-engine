import type {
  AdvancedAlert,
  AdvancedAlertDomain,
  AdvancedAlertSeverity,
  MonthProjection,
} from '../types';

const DOMAIN_ORDER: AdvancedAlertDomain[] = ['DEFICIT', 'DEFERRED', 'CEILING', 'BUDGET', 'TREND'];

const SEVERITY_ORDER: Record<AdvancedAlertSeverity, number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

const RAPID_TREND_THRESHOLD = 0.05;

const makeGroupId = (domain: AdvancedAlertDomain, category?: string) => {
  return category ? `${domain}:${category}` : domain;
};

const compareAlerts = (a: AdvancedAlert, b: AdvancedAlert): number => {
  const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  if (severityDiff !== 0) {
    return severityDiff;
  }

  const domainDiff = DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain);
  if (domainDiff !== 0) {
    return domainDiff;
  }

  const categoryA = a.category ?? '';
  const categoryB = b.category ?? '';
  if (categoryA !== categoryB) {
    return categoryA.localeCompare(categoryB);
  }

  return a.ruleId.localeCompare(b.ruleId);
};

export const generateAdvancedAlerts = (projection: MonthProjection[]): AdvancedAlert[] => {
  const alerts: AdvancedAlert[] = [];

  projection.forEach((month) => {
    const monthLabel = month.month;

    if (month.endingBalance < 0) {
      alerts.push({
        month: monthLabel,
        domain: 'DEFICIT',
        severity: 'CRITICAL',
        ruleId: `DEFICIT:NEGATIVE:${monthLabel}`,
        groupId: makeGroupId('DEFICIT'),
        priorityRank: 0,
        metadata: { endingBalance: month.endingBalance },
      });
    }

    month.deferredResolutions.forEach((resolution, index) => {
      if (resolution.status !== 'FORCED') {
        return;
      }
      alerts.push({
        month: monthLabel,
        domain: 'DEFERRED',
        category: resolution.category,
        severity: 'WARNING',
        ruleId: `DEFERRED:FORCED:${monthLabel}:${resolution.transactionId ?? index}`,
        groupId: makeGroupId('DEFERRED', resolution.category),
        priorityRank: 0,
        metadata: {
          transactionId: resolution.transactionId,
          amount: resolution.amount,
          priority: resolution.priority,
        },
      });
    });

    month.ceilings.forEach((ceiling) => {
      if (ceiling.state === 'NOT_REACHED') {
        return;
      }
      const severity: AdvancedAlertSeverity = ceiling.state === 'EXCEEDED' ? 'CRITICAL' : 'WARNING';
      alerts.push({
        month: monthLabel,
        domain: 'CEILING',
        severity,
        ruleId: `CEILING:${ceiling.ruleId}:${ceiling.state}:${monthLabel}`,
        groupId: makeGroupId('CEILING'),
        priorityRank: 0,
        metadata: {
          ruleId: ceiling.ruleId,
          state: ceiling.state,
          ceiling: ceiling.ceiling,
          outflow: ceiling.totalOutflow,
        },
      });
    });

    month.categoryBudgets.forEach((budget) => {
      if (budget.status === 'OK') {
        return;
      }
      const severity: AdvancedAlertSeverity = budget.status === 'EXCEEDED' ? 'CRITICAL' : 'WARNING';
      alerts.push({
        month: monthLabel,
        domain: 'BUDGET',
        category: budget.category,
        severity,
        ruleId: `BUDGET:${budget.category}:${budget.status}:${monthLabel}`,
        groupId: makeGroupId('BUDGET', budget.category),
        priorityRank: 0,
        metadata: {
          budget: budget.budget,
          spent: budget.spent,
          status: budget.status,
        },
      });
    });

    (month.trends ?? []).forEach((trend) => {
      if (trend.trend !== 'INCREASING' || trend.percentChange <= RAPID_TREND_THRESHOLD) {
        return;
      }
      alerts.push({
        month: monthLabel,
        domain: 'TREND',
        category: trend.category,
        severity: 'WARNING',
        ruleId: `TREND:${trend.category}:${monthLabel}`,
        groupId: makeGroupId('TREND', trend.category),
        priorityRank: 0,
        metadata: {
          percentChange: trend.percentChange,
          current: trend.current,
          previous: trend.previous,
        },
      });
    });
  });

  const sortedAlerts = [...alerts].sort(compareAlerts);
  return sortedAlerts.map((alert, index) => ({ ...alert, priorityRank: index + 1 }));
};
