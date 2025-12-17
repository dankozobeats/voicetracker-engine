import type { AlertSeverity } from './types';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);

export const severityBadgeColor = (severity: AlertSeverity): string => {
  switch (severity) {
    case 'CRITICAL':
      return '#d62b2b';
    case 'WARNING':
      return '#ff9f00';
    default:
      return '#2f855a';
  }
};
