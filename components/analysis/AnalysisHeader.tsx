type AnalysisHeaderProps = {
  title: string;
  period: string;
  statuses: string[];
};

const statusColors: Record<string, string> = {
  'Lecture seule': 'bg-slate-800 text-slate-200 border-slate-700',
  Snapshot: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Premium: 'bg-violet-50 text-violet-600 border-violet-200',
};

export function AnalysisHeader({ title, period, statuses }: AnalysisHeaderProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-900/60 p-8 shadow-[0_25px_65px_rgba(2,6,23,0.65)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Analyse</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">{title}</h1>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-800 px-4 py-1 text-sm font-semibold text-slate-200">
          {period}
        </span>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {statuses.map((status) => (
          <span
            key={status}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] ${
              statusColors[status] ?? 'border-slate-600 bg-white/10 text-slate-200'
            }`}
          >
            {status}
          </span>
        ))}
      </div>
    </section>
  );
}
