import { Badge } from "@/components/ui/badge";
import { priceWindowState, todayIST } from "@/lib/forms";

export function PriceWindowBadge({ from, to }: { from: string; to?: string | null }) {
  const s = priceWindowState(from, to, todayIST());
  if (s === "active") return <Badge tone="green">Active</Badge>;
  if (s === "scheduled") return <Badge tone="neutral">Scheduled</Badge>;
  return <Badge tone="maroon">Expired</Badge>;
}
