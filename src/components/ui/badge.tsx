import { cn } from "@/lib/cn";

export type Tone = "green" | "maroon" | "neutral" | "gold" | "sky";

const tones: Record<Tone, string> = {
  green: "bg-drs-green/10 text-drs-green ring-drs-green/20",
  maroon: "bg-drs-maroon/10 text-drs-maroon ring-drs-maroon/20",
  neutral: "bg-drs-ink/5 text-drs-ink ring-drs-ink/15",
  // Gold is an accent: a thin ring + ink text keeps AA contrast and avoids a big gold fill.
  gold: "bg-drs-white text-drs-ink ring-drs-gold",
  // Sky is reserved for the milk / buttermilk line.
  sky: "bg-drs-sky/25 text-drs-ink ring-drs-sky",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const GREEN = [
  "active",
  "approved",
  "paid",
  "delivered",
  "published",
  "processed",
  "resolved",
  "completed",
  "received",
  "captured",
  "success",
  "sent",
  "enabled",
  "confirmed",
  "settled",
  "subscribed",
  "frozen",
];
const MAROON = [
  "retired",
  "rejected",
  "failed",
  "cancelled",
  "canceled",
  "expired",
  "voided",
  "void",
  "hidden",
  "suspended",
  "closed",
  "unsubscribed",
  "disabled",
  "error",
  "bounced",
  "not_delivered",
  "depleted",
];

/** Map any backend status string onto a tone (green = done/good, maroon = stopped/bad). */
export function statusTone(status: string | null | undefined): Tone {
  const s = (status ?? "").toLowerCase();
  if (GREEN.includes(s)) return "green";
  if (MAROON.includes(s)) return "maroon";
  return "neutral";
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = status ?? "unknown";
  const label = s.replace(/[_-]+/g, " ");
  return <Badge tone={statusTone(s)}>{label.charAt(0).toUpperCase() + label.slice(1)}</Badge>;
}

/** Milk and buttermilk are the only places sky blue appears. */
export function isMilkLine(category: string | null | undefined): boolean {
  return !!category && /\b(butter)?milk\b/i.test(category);
}

export function CategoryBadge({ category }: { category: string | null | undefined }) {
  if (!category) return <span className="text-drs-ink/70">—</span>;
  return <Badge tone={isMilkLine(category) ? "sky" : "neutral"}>{category}</Badge>;
}
