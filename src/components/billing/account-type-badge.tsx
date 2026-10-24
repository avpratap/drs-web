import { Badge } from "@/components/ui/badge";

export function AccountTypeBadge({ type }: { type: string }) {
  return type === "b2b" ? <Badge tone="gold">B2B</Badge> : <Badge tone="green">Retail</Badge>;
}

export function BillingModeLabel({ mode }: { mode: string }) {
  return <span>{mode === "postpaid_credit" ? "Postpaid credit" : "Prepaid wallet"}</span>;
}
