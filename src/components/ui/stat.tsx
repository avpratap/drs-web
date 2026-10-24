import { cn } from "@/lib/cn";

/** KPI tile. `accent` adds the gold hairline — use on at most one tile per row. */
export function StatCard({
  label,
  value,
  sub,
  accent,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
  tone?: "default" | "alert";
}) {
  return (
    <div className="rounded-xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm md:p-5">
      <p className="text-xs font-medium tracking-wide text-drs-ink/70 uppercase">{label}</p>
      <p
        className={cn(
          "mt-2 text-lg leading-tight font-semibold [overflow-wrap:anywhere] md:text-2xl",
          tone === "alert" ? "text-drs-maroon" : "text-drs-green",
        )}
      >
        {value}
      </p>
      {accent && <div aria-hidden className="mt-2 h-0.5 w-8 rounded bg-drs-gold" />}
      {sub && <p className="mt-1 text-xs text-drs-ink/70">{sub}</p>}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">{children}</div>;
}
