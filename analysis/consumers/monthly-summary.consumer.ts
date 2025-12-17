import type {
  AdvancedAlert,
  AdvancedAlertDomain,
  AdvancedAlertSeverity,
  CategoryBudgetTrendResult,
} from 'engine/types';

export interface MonthlySummaryInput {
  month: string; // YYYY-MM
  alerts: AdvancedAlert[];
  trends: CategoryBudgetTrendResult[];
}

export interface MonthlySummaryOutput {
  month: string;
  title: string;
  highlights: string[];
  details: string[];
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Janvier',
  '02': 'Février',
  '03': 'Mars',
  '04': 'Avril',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juillet',
  '08': 'Août',
  '09': 'Septembre',
  '10': 'Octobre',
  '11': 'Novembre',
  '12': 'Décembre',
};

const DOMAIN_LABELS: Record<AdvancedAlertDomain, string> = {
  DEFICIT: 'Déficit',
  DEFERRED: 'Différé',
  CEILING: 'Plafond',
  BUDGET: 'Budget',
  TREND: 'Tendance',
};

const SEVERITY_ORDER: Record<AdvancedAlertSeverity, number> = {
  CRITICAL: 1,
  WARNING: 2,
  INFO: 3,
};

const SEVERITY_PHRASES: Record<AdvancedAlertSeverity, string> = {
  CRITICAL: 'critiques',
  WARNING: 'de vigilance',
  INFO: 'informelles',
};

const SEVERITY_DETAIL_PHRASES: Record<AdvancedAlertSeverity, string> = {
  CRITICAL: 'est critique',
  WARNING: 'nécessite de la vigilance',
  INFO: 'reste informative',
};

const TREND_DESCRIPTIONS: Record<CategoryBudgetTrendResult['trend'], string> = {
  INCREASING: 'en hausse',
  DECREASING: 'en baisse',
  STABLE: 'stable',
  NO_HISTORY: 'sans historique',
};

const formatMonthTitle = (month: string): string => {
  const [year, monthKey] = month.split('-');
  const label = MONTH_LABELS[monthKey] ?? monthKey;
  return `Résumé financier — ${label} ${year}`;
};

const buildAlertHighlight = (alert: AdvancedAlert): string => {
  const domainLabel = DOMAIN_LABELS[alert.domain] ?? alert.domain;
  const categorySegment = alert.category ? ` — ${alert.category}` : '';
  return `Une alerte ${SEVERITY_PHRASES[alert.severity]} pour ${domainLabel}${categorySegment}.`;
};

const buildAlertDetail = (alert: AdvancedAlert): string => {
  const domainLabel = DOMAIN_LABELS[alert.domain] ?? alert.domain;
  const categorySegment = alert.category ? ` — ${alert.category}` : '';
  return `La sévérité ${SEVERITY_DETAIL_PHRASES[alert.severity]} pour ${domainLabel}${categorySegment} (règle ${alert.ruleId}, groupe ${alert.groupId}).`;
};

const buildTrendDetail = (trend: CategoryBudgetTrendResult): string => {
  const trendLabel = TREND_DESCRIPTIONS[trend.trend];
  const category = trend.category ?? 'catégorie';
  const percent = Number.isFinite(trend.percentChange)
    ? `${trend.percentChange}%`
    : `${trend.percentChange}`;
  return `La tendance des dépenses pour ${category} est ${trendLabel} (${percent} de variation).`;
};

export const monthlySummaryConsumer = (input: MonthlySummaryInput): MonthlySummaryOutput => {
  const { month, alerts, trends } = input;

  const highlights = alerts
    .map((alert) => ({
      priorityRank: alert.priorityRank,
      text: buildAlertHighlight(alert),
    }))
    .sort((a, b) => a.priorityRank - b.priorityRank)
    .slice(0, 3)
    .map((entry) => entry.text);

  const detailCandidates = [
    ...alerts.map((alert) => ({
      severity: alert.severity,
      priorityRank: alert.priorityRank,
      text: buildAlertDetail(alert),
    })),
    ...trends.map((trend, index) => ({
      severity: 'INFO' as AdvancedAlertSeverity,
      priorityRank: 1000 + index,
      text: buildTrendDetail(trend),
    })),
  ];

  const details = detailCandidates
    .sort((a, b) => {
      const severityCompare = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (severityCompare !== 0) return severityCompare;
      return a.priorityRank - b.priorityRank;
    })
    .map((entry) => entry.text);

  return {
    month,
    title: formatMonthTitle(month),
    highlights,
    details,
  };
};
