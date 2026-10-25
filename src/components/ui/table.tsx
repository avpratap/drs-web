import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Hide on small screens (shown from md up). */
  hideOnMobile?: boolean;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  empty = "Nothing here yet.",
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  empty?: React.ReactNode;
  caption: string;
}) {
  return (
    <div
      // Focusable so keyboard users can scroll a table that is wider than a phone screen.
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="relative overflow-x-auto rounded-xl border border-drs-ink/10 bg-drs-white shadow-sm"
    >
      <table className="w-full min-w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-drs-ink/10 bg-drs-cream/60">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "px-4 py-3 text-xs font-semibold tracking-wide text-drs-green uppercase",
                  c.hideOnMobile && "hidden md:table-cell",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody aria-busy={loading || undefined}>
          {loading ? (
            Array.from({ length: 4 }, (_, i) => (
              <tr key={i} className="border-b border-drs-ink/5 last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-4", c.hideOnMobile && "hidden md:table-cell")}>
                    <div className="h-3 w-3/4 animate-pulse rounded bg-drs-ink/10" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={columns.length} role="alert" className="px-4 py-10 text-center text-drs-maroon">
                {error}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-drs-ink/70">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-drs-ink/5 last:border-0 hover:bg-drs-cream/40">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-3 align-middle",
                      c.hideOnMobile && "hidden md:table-cell",
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({
  page,
  pageCount,
  hasNext,
  onPage,
  total,
}: {
  page: number;
  pageCount?: number;
  hasNext: boolean;
  onPage: (p: number) => void;
  total?: number;
}) {
  const btn = buttonClass(
    "secondary",
    "disabled:border-drs-ink/15 disabled:bg-drs-white disabled:opacity-40",
  );
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-2">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="text-center text-sm text-drs-ink/75" aria-live="polite">
        Page {page}
        {pageCount ? ` of ${pageCount}` : ""}
        {total !== undefined && (
          <span className="hidden md:inline"> · {total.toLocaleString("en-IN")} total</span>
        )}
      </span>
      <button type="button" className={btn} disabled={!hasNext} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  );
}
