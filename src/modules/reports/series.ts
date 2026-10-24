import { todayIST } from "@/lib/forms";

export type RevenuePoint = { date: string; revenue: number; orders: number };

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

/** The API returns only days with paid orders; fill the window so the trend is continuous. */
export function fillDays(points: RevenuePoint[], days: number, today = todayIST()): RevenuePoint[] {
  const byDate = new Map(points.map((p) => [p.date, p]));
  const out: RevenuePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    out.push(byDate.get(date) ?? { date, revenue: 0, orders: 0 });
  }
  return out;
}
