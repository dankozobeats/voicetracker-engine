type AlertSeverity = 'CRITICAL' | 'WARNING' | 'OK';

type AlertItem = {
  domain: string;
  category: string;
  severity: AlertSeverity;
  ruleId: string;
};

type AlertsListProps = {
  alerts: AlertItem[];
};

const severityStyles: Record<
  AlertSeverity,
  { badge: string; background: string; border: string; text: string }
> = {
  CRITICAL: {
    badge: 'text-red-700 bg-red-50 border border-red-100',
    background: 'bg-red-50/80',
    border: 'border-red-200',
    text: 'text-red-600',
  },
  WARNING: {
    badge: 'text-amber-700 bg-amber-50 border border-amber-100',
    background: 'bg-amber-50/60',
    border: 'border-amber-200',
    text: 'text-amber-600',
  },
  OK: {
    badge: 'text-emerald-700 bg-emerald-50 border border-emerald-100',
    background: 'bg-emerald-50/70',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
  },
};

export function AlertsList({ alerts }: AlertsListProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <ul className="space-y-4">
        {alerts.map((alert) => (
          <li
            key={`${alert.domain}-${alert.category}-${alert.ruleId}`}
            className={`rounded-xl border-l-4 p-4 shadow-sm ${severityStyles[alert.severity].background} ${severityStyles[alert.severity].border}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Domaine</p>
                <p className="text-base font-semibold text-slate-900">{alert.domain}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] ${severityStyles[alert.severity].badge}`}
              >
                {alert.severity}
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Catégorie</p>
                <p className="text-base font-semibold text-slate-900">{alert.category}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Règle</p>
                <p className="text-base font-semibold text-slate-900">{alert.ruleId}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
