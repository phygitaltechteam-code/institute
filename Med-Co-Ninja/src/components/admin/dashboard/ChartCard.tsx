import { ReactNode, useState } from 'react';

type ChartCardProps = {
  title: string;
  subtitle?: string;
  /** Rows for the accessible table view: [label, formatted value] */
  table: { label: string; value: string }[];
  valueHeader: string;
  children: ReactNode;
};

/** Card wrapper for a single-series chart with a Chart / Table toggle (table = exact numbers, screen-reader friendly). */
const ChartCard = ({ title, subtitle, table, valueHeader, children }: ChartCardProps) => {
  const [view, setView] = useState<'chart' | 'table'>('chart');

  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-stroke bg-white p-3 shadow-sm sm:p-4">
      <header className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-text-charcoal sm:text-base">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 rounded-md border border-stroke p-0.5 text-[11px] font-medium" role="tablist">
          {(['chart', 'table'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded px-2 py-0.5 capitalize transition ${
                view === v ? 'bg-primary-navy text-white' : 'text-slate-500 hover:text-primary-navy'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      {view === 'chart' ? (
        <div className="relative h-56 sm:h-64">{children}</div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="sticky top-0 bg-white text-left text-slate-500">
              <tr>
                <th className="py-1.5 font-medium">Period</th>
                <th className="py-1.5 text-right font-medium">{valueHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke">
              {table.map((r) => (
                <tr key={r.label}>
                  <td className="py-1.5 text-text-charcoal">{r.label}</td>
                  <td className="py-1.5 text-right font-medium tabular-nums text-text-charcoal">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ChartCard;
