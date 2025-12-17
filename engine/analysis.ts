import { AnalysisResult, EngineAlert, MonthProjection } from './types';

const levelOrder: Record<EngineAlert['level'], number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

const addInsight = (insights: string[], text: string) => {
  if (!insights.includes(text)) {
    insights.push(text);
  }
};

const describeBudgetAlert = (alert: EngineAlert): string | null => {
  const category = (alert.metadata?.category as string) ?? 'catégorie inconnue';
  if (alert.type === 'CATEGORY_BUDGET_EXCEEDED') {
    return `Le budget ${category} est régulièrement dépassé`;
  }
  if (alert.type === 'CATEGORY_BUDGET_WARNING') {
    return `Le budget ${category} approche de son seuil`;
  }
  return null;
};

const describeCeilingAlert = (alert: EngineAlert): string | null => {
  if (alert.type !== 'CEILING_REACHED') {
    return null;
  }
  const ruleId = (alert.metadata?.ruleId as string) ?? 'non identifié';
  return `Le plafond ${ruleId} a été atteint`;
};

const describeDeferredAlert = (alert: EngineAlert): string | null => {
  if (alert.type !== 'DEFERRED_FORCED') {
    return null;
  }
  return `Les différés forcés indiquent une tension de trésorerie`;
};

const describeDeficitAlert = (alerts: EngineAlert[]): string | null => {
  const deficitWorsening = alerts.filter((alert) => alert.type === 'DEFICIT_WORSENING');
  if (deficitWorsening.length >= 2) {
    return 'Le déficit augmente depuis plusieurs mois';
  }
  if (deficitWorsening.length === 1) {
    return 'Le déficit montre une croissance récente';
  }
  return null;
};

export const analyzeProjection = (
  projection: MonthProjection[],
  alerts: EngineAlert[],
): AnalysisResult => {
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityComparison = levelOrder[a.level] - levelOrder[b.level];
    if (severityComparison !== 0) {
      return severityComparison;
    }
    return a.type.localeCompare(b.type);
  });

  const insights: string[] = [];

  sortedAlerts.forEach((alert) => {
    const budgetInsight = describeBudgetAlert(alert);
    if (budgetInsight) {
      addInsight(insights, budgetInsight);
    }

    const ceilingInsight = describeCeilingAlert(alert);
    if (ceilingInsight) {
      addInsight(insights, ceilingInsight);
    }

    const deferredInsight = describeDeferredAlert(alert);
    if (deferredInsight) {
      addInsight(insights, deferredInsight);
    }
  });

  const deficitInsight = describeDeficitAlert(sortedAlerts);
  if (deficitInsight) {
    addInsight(insights, deficitInsight);
  }

  if (projection.some((month) => month.categoryBudgets.some((budget) => budget.status === 'EXCEEDED')) && !insights.some((text) => text.includes('dépassé'))) {
    addInsight(insights, 'Un budget est régulièrement dépassé selon les projections');
  }

  return { insights };
};
