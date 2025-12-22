type KpiItem = {
  title: string;
  value: string;
  description?: string;
  accent?: 'positive' | 'negative' | 'neutral';
};

type KpiRowProps = {
  items: KpiItem[];
};

const accentTextColors: Record<NonNullable<KpiItem['accent']>, string> = {
  positive: 'text-white',
  negative: 'text-rose-700',
  neutral: 'text-slate-900',
};

const accentBgColors: Record<NonNullable<KpiItem['accent']>, string> = {
  positive: 'border-emerald-800 bg-gradient-to-br from-emerald-900 to-emerald-700',
  negative: 'border-rose-200 bg-rose-50',
  neutral: 'border-slate-100 bg-white',
};

export function KpiRow({ items }: KpiRowProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.title}
          className={`rounded-2xl border p-6 shadow-sm ${
            item.accent ? accentBgColors[item.accent] : 'border-slate-100 bg-white'
          }`}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{item.title}</p>
          <p
            className={`mt-3 text-4xl font-semibold tracking-tight ${
              item.accent ? accentTextColors[item.accent] : 'text-slate-900'
            }`}
          >
            {item.value}
          </p>
          {item.description ? <p className="mt-2 text-sm text-slate-500">{item.description}</p> : null}
        </article>
      ))}
    </div>
  );
}
