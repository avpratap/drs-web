"use client";

import { useList, useOne } from "@refinedev/core";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { TextLink } from "@/components/ui/links";
import { Select } from "@/components/ui/select";
import { StatCard, StatGrid } from "@/components/ui/stat";
import { DataTable, type Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatQty, money } from "@/lib/format";
import { formatDate, todayIST } from "@/lib/forms";

type Route = components["schemas"]["RouteOut"] & { id: string };
type Order = components["schemas"]["DeliveryOrderOut"];
type User = components["schemas"]["UserAdminOut"];
type Stop = { seq: number; id: number; order?: Order };

const columns: Column<Stop>[] = [
  {
    key: "seq",
    header: "Stop",
    className: "tabular-nums",
    cell: (s) => <span className="font-semibold text-drs-green">{s.seq}</span>,
  },
  {
    key: "shop",
    header: "Shop",
    cell: (s) => (
      <TextLink href={`/admin/delivery/${s.id}`} sub={`Delivery #${s.id}`}>
        {s.order?.shop_name ?? (s.order ? `Shop #${s.order.shop_id}` : `Delivery #${s.id}`)}
      </TextLink>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (s) => (s.order ? <StatusBadge status={s.order.status} /> : "—"),
  },
  {
    key: "total",
    header: "Total",
    hideOnMobile: true,
    className: "tabular-nums",
    cell: (s) => (s.order ? money(s.order.total) : "—"),
  },
];

/** Orders a date's delivery stops into a short route (all stops, or one driver's shops). */
export default function RoutePlannerPage() {
  const [date, setDate] = useState(todayIST);
  const [driver, setDriver] = useState<number | "">("");
  const drivers = useList<User>({
    resource: "users",
    pagination: { mode: "off" },
    filters: [
      { field: "role", operator: "eq", value: "delivery" },
      { field: "status", operator: "eq", value: "active" },
    ],
  });
  const { result: route, query } = useOne<Route>({
    resource: "route",
    id: "plan",
    meta: { date, deliveryId: driver || undefined },
  });
  const orders = useList<Order>({
    resource: "delivery-orders",
    pagination: { currentPage: 1, pageSize: 200 },
    filters: [{ field: "date", operator: "eq", value: date }],
  });
  const byId = new Map(orders.result.data.map((o) => [o.id, o]));
  const stops: Stop[] = [...(route?.stops ?? [])]
    .sort((a, b) => a.seq - b.seq)
    .map((s) => ({ ...s, order: byId.get(s.id) }));
  const driverOptions = drivers.result.data.map((u) => ({
    value: u.id,
    label: `${u.full_name || "Driver"} · ${u.phone}`,
  }));

  return (
    <>
      <PageHeader
        title="Route planner"
        description="The day's delivery stops in driving order, from shop locations. Stops without a location keep their place at the end."
      />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:items-end">
        <div className="flex flex-col gap-1.5 md:w-48">
          <label htmlFor="route-date" className="text-xs font-medium text-drs-ink/75">
            Delivery date
          </label>
          <DatePicker id="route-date" value={date} onChange={(v) => setDate(v || todayIST())} />
        </div>
        <div className="flex flex-col gap-1.5 md:w-72">
          <label htmlFor="route-driver" className="text-xs font-medium text-drs-ink/75">
            Driver
          </label>
          <Select
            id="route-driver"
            value={driver}
            options={driverOptions}
            clearable
            emptyLabel="All stops"
            placeholder="All stops"
            onChange={(v) => setDriver(v === "" ? "" : Number(v))}
          />
        </div>
      </div>

      <section aria-label="Route summary" aria-busy={query.isLoading || undefined} className="mb-6">
        <StatGrid>
          <StatCard label="Date" value={formatDate(date)} accent />
          <StatCard label="Stops" value={query.isLoading ? "—" : stops.length} />
          <StatCard
            label="Distance"
            value={query.isLoading || !route ? "—" : `${formatQty(route.total_distance_km, 1)} km`}
          />
        </StatGrid>
      </section>

      {query.error ? (
        <p role="alert" className="rounded-lg bg-drs-maroon/10 p-4 text-sm text-drs-maroon">
          {query.error.message}
        </p>
      ) : (
        <DataTable
          caption="Stops in order"
          columns={columns}
          rows={stops}
          rowKey={(s) => s.id}
          loading={query.isLoading}
          empty="No delivery stops for this date."
        />
      )}
    </>
  );
}
