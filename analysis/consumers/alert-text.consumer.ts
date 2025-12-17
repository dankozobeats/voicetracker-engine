import type { AdvancedAlert, AdvancedAlertDomain, AdvancedAlertSeverity } from 'engine/types';

export type AlertTextOutput = {
  groupId: string;
  severity: AdvancedAlertSeverity;
  title: string;
  message: string;
  priorityRank: number;
}[];

const DOMAIN_LABELS: Record<AdvancedAlertDomain, string> = {
  DEFICIT: 'Déficit',
  DEFERRED: 'Différé',
  CEILING: 'Plafond',
  BUDGET: 'Budget',
  TREND: 'Tendance',
};

const SEVERITY_TONES: Record<AdvancedAlertSeverity, string> = {
  INFO: 'informatif, neutre',
  WARNING: 'attention / seuil approché',
  CRITICAL: 'action requise / dépassement',
};

const formatMetadata = (metadata?: Record<string, unknown>): string | undefined => {
  if (!metadata || Object.keys(metadata).length === 0) return undefined;
  return Object.entries(metadata)
    .map(([key, value]) => `${key} : ${value}`)
    .join(' · ');
};

export const alertTextConsumer = (alerts: AdvancedAlert[]): AlertTextOutput => {
  const sortedAlerts = [...alerts].sort((left, right) => left.priorityRank - right.priorityRank);

  return sortedAlerts.map((alert) => {
    const domainLabel = DOMAIN_LABELS[alert.domain] ?? alert.domain;
    const titleParts = [domainLabel, alert.category].filter(Boolean);
    const title = titleParts.join(' — ');
    const metadataSegment = formatMetadata(alert.metadata);

    const messageSections = [
      `Ton : ${SEVERITY_TONES[alert.severity]}`,
      `Domaine : ${domainLabel}`,
      alert.category ? `Catégorie : ${alert.category}` : undefined,
      `Règle : ${alert.ruleId}`,
      `Groupe : ${alert.groupId}`,
      metadataSegment ? `Données : ${metadataSegment}` : undefined,
    ].filter((section): section is string => Boolean(section));

    return {
      groupId: alert.groupId,
      severity: alert.severity,
      title: title || domainLabel,
      message: messageSections.join(' · '),
      priorityRank: alert.priorityRank,
    };
  });
};
