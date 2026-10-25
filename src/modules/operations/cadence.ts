const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Human cadence for a standing-order line: "Daily", "Every 2 days", "Mon, Wed, Fri". */
export function cadence(i: {
  frequency: string;
  interval_days?: number | null;
  days_of_week?: string | null;
}): string {
  if (i.frequency === "alternate") return `Every ${i.interval_days ?? "?"} days`;
  if (i.frequency === "weekly")
    return (i.days_of_week ?? "")
      .split(",")
      .map((d) => WEEKDAYS[Number(d) - 1] ?? d)
      .join(", ");
  return "Daily";
}
