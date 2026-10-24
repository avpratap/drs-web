import { Badge } from "@/components/ui/badge";
import { humanize } from "@/lib/format";

export function PriorityBadge({ priority }: { priority: string }) {
  return priority === "high" ? <Badge tone="maroon">High</Badge> : <Badge>{humanize(priority)}</Badge>;
}

/** Star rating with a text equivalent for screen readers. */
export function Stars({ value }: { value: number }) {
  return (
    <span className="whitespace-nowrap" title={`${value} of 5`}>
      <span aria-hidden className="tracking-tight text-drs-green">
        {"★".repeat(value)}
        <span className="text-drs-ink/25">{"★".repeat(Math.max(0, 5 - value))}</span>
      </span>
      <span className="sr-only">{value} out of 5 stars</span>
    </span>
  );
}
