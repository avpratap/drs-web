import { money } from "@/lib/format";

export function couponValue(c: {
  discount_type: string;
  value: number;
  max_discount?: number | null;
}): string {
  if (c.discount_type === "percent")
    return `${c.value}% off${c.max_discount ? ` (max ${money(c.max_discount)})` : ""}`;
  return `${money(c.value)} off`;
}
