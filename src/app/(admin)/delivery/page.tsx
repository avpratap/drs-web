"use client";

import { useOne } from "@refinedev/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { RowLink, TextLink } from "@/components/ui/links";
import { StatCard, StatGrid } from "@/components/ui/stat";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDate, money } from "@/lib/format";
import { todayIST } from "@/lib/forms";

type DO = components["schemas"]["DeliveryOrderOut"];
type Summary = components["schemas"]["SummaryOut"];

const columns: Column<DO>[] = [
  {
    key: "stop",
    header: "Stop",
    cell: (o) => (
      <TextLink href={`/delivery/${o.id}`} sub={o.contact_name ?? undefined}>
        {o.shop_name ?? `Shop #${o.shop_id}`}
      </TextLink>
    ),
  },
  {
    key: "address",
    header: "Address",
    hideOnMobile: true,
    cell: (o) => (
      <span className="text-sm">
        {o.address ?? "—"}
        {o.pincode && <span className="block text-xs text-drs-ink/65">{o.pincode}</span>}
      </span>
    ),
  },
  {
    key: "items",
    header: "Items",
    hideOnMobile: true,
    className: "tabular-nums",
    cell: (o) => o.items.length,
  },
  { key: "due", header: "Amount due", className: "tabular-nums", cell: (o) => money(o.amount_due) },
  { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (o) => (
      <RowLink href={`/delivery/${o.id}`} srLabel={`for ${o.shop_name ?? `shop ${o.shop_id}`}`}>
        Details
      </RowLink>
    ),
  },
];

export default function DeliveryPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const date = params.get("date") || todayIST();
  const { result: s, query } = useOne<Summary>({ resource: "delivery-summary", id: date });

  return (
    <>
      <PageHeader
        title="Daily deliveries"
        description="Every stop for a delivery date: status, amount due, cash collected and proof of delivery."
        actions={
          <div className="flex flex-col gap-1.5">
            <label htmlFor="delivery-date" className="text-xs font-medium text-drs-ink/75">
              Delivery date
            </label>
            <DatePicker
              id="delivery-date"
              value={date}
              onChange={(v) => router.replace(`${pathname}?date=${v || todayIST()}`)}
              className="md:w-48"
            />
          </div>
        }
      />
      <section
        aria-label={`Summary for ${formatDate(date)}`}
        aria-busy={query.isLoading || undefined}
        className="mb-6"
      >
        <StatGrid>
          <StatCard label="Delivered" value={s?.delivered ?? "—"} accent />
          <StatCard label="Pending" value={s?.pending ?? "—"} />
          <StatCard
            label="Failed"
            value={s?.failed ?? "—"}
            tone={(s?.failed ?? 0) > 0 ? "alert" : "default"}
          />
          <StatCard label="Cash collected" value={s ? money(s.cash_collected) : "—"} />
        </StatGrid>
      </section>
      <ResourceList<DO>
        key={date}
        embedded
        resource="delivery-orders"
        title={`Stops on ${formatDate(date)}`}
        caption={`Delivery stops on ${formatDate(date)}`}
        columns={columns}
        permanentFilters={[{ field: "date", operator: "eq", value: date }]}
        pageSize={50}
        empty="No stops scheduled for this date. Run the cutoff to generate them."
      />
    </>
  );
}
