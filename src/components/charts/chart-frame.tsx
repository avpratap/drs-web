import { useId } from "react";

/** Card chrome for a chart: title, subtitle, the plot, and a disclosable data table. */
export function ChartFrame({
  title,
  subtitle,
  children,
  table,
  loading,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  table: { headers: string[]; rows: (string | number)[][] };
  loading?: boolean;
}) {
  const id = useId();
  return (
    <figure
      aria-labelledby={`${id}-t`}
      className="min-w-0 rounded-xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm md:p-6"
      aria-busy={loading || undefined}
    >
      <figcaption>
        <h2 id={`${id}-t`} className="text-base font-semibold text-drs-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs text-drs-ink/70">{subtitle}</p>}
      </figcaption>
      <div className={loading ? "opacity-50 transition-opacity" : "transition-opacity"}>{children}</div>
      <details className="mt-3 text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-drs-green">
          Show data table
        </summary>
        <div
          role="region"
          aria-label={`${title} data`}
          tabIndex={0}
          className="relative mt-2 max-h-72 overflow-auto rounded-lg border border-drs-ink/10"
        >
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{title} — data</caption>
            <thead className="bg-drs-cream/60">
              <tr>
                {table.headers.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2 text-xs font-semibold text-drs-green uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-t border-drs-ink/5">
                  {r.map((c, j) => (
                    <td key={j} className={`px-3 py-1.5 ${j > 0 ? "tabular-nums" : ""}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
