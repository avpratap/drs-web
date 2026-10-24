import { Badge } from "@/components/ui/badge";

export function TierTypeBadge({ type }: { type: string }) {
  return type === "b2b" ? <Badge tone="gold">B2B</Badge> : <Badge tone="green">Retail</Badge>;
}
