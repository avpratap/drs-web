export function isLow(s: { qty_on_hand: number; reorder_point: number }): boolean {
  return s.reorder_point > 0 && s.qty_on_hand <= s.reorder_point;
}

/** Days from `today` (YYYY-MM-DD) until `date`; negative when past. */
export function daysUntil(date: string, today: string): number {
  const [y1, m1, d1] = date.split("-").map(Number);
  const [y2, m2, d2] = today.split("-").map(Number);
  return Math.round((Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / 86_400_000);
}
