type ExecutiveSummaryCardProps = {
  metrics: {
    label: string;
    value: string;
  }[];
};

export function ExecutiveSummaryCard({ metrics }: ExecutiveSummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex-1">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
