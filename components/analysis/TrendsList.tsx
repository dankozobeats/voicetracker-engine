type TrendDirection = 'up' | 'down' | 'stable';

type TrendItem = {
  category: string;
  variation: string;
  direction: TrendDirection;
};

type TrendsListProps = {
  trends: TrendItem[];
};

const directionSymbols: Record<TrendDirection, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
};

const variationStyles: Record<TrendDirection, string> = {
  up: 'text-emerald-700',
  down: 'text-rose-600',
  stable: 'text-slate-500',
};

export function TrendsList({ trends }: TrendsListProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {trends.map((trend) => (
          <article
            key={`${trend.category}-${trend.variation}`}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Catégorie</p>
              <p className="text-lg font-semibold text-slate-900">{trend.category}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Variation</p>
                <p className={`mt-1 text-2xl font-semibold tracking-tight ${variationStyles[trend.direction]}`}>
                  {trend.variation}
                </p>
              </div>
              <span
                className={`text-3xl font-semibold leading-none ${
                  trend.direction === 'up'
                    ? 'text-emerald-600'
                    : trend.direction === 'down'
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {directionSymbols[trend.direction]}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
