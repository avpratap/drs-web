"use client";

import { couponValue } from "@/components/customers/coupon-value";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge } from "@/components/ui/badge";
import { RowLink, TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDate, money } from "@/lib/format";

type Coupon = components["schemas"]["CouponOut"];

const columns: Column<Coupon>[] = [
  {
    key: "code",
    header: "Code",
    cell: (c) => (
      <TextLink href={`/coupons/${c.id}`} className="font-mono">
        {c.code}
      </TextLink>
    ),
  },
  { key: "value", header: "Discount", cell: (c) => couponValue(c) },
  {
    key: "min",
    header: "Min order",
    hideOnMobile: true,
    className: "tabular-nums",
    cell: (c) => (c.min_order_value ? money(c.min_order_value) : "—"),
  },
  {
    key: "used",
    header: "Used",
    hideOnMobile: true,
    className: "tabular-nums",
    cell: (c) => `${c.used_count}${c.usage_limit ? ` / ${c.usage_limit}` : ""}`,
  },
  {
    key: "valid",
    header: "Valid",
    hideOnMobile: true,
    cell: (c) =>
      c.valid_from || c.valid_to
        ? `${formatDate(c.valid_from)} → ${c.valid_to ? formatDate(c.valid_to) : "open"}`
        : "Always",
  },
  {
    key: "active",
    header: "Status",
    cell: (c) => (c.active ? <Badge tone="green">Active</Badge> : <Badge tone="maroon">Inactive</Badge>),
  },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (c) => (
      <RowLink href={`/coupons/${c.id}/edit`} srLabel={c.code}>
        Edit
      </RowLink>
    ),
  },
];

export default function CouponsPage() {
  return (
    <ResourceList<Coupon>
      resource="coupons"
      title="Coupons"
      description="Discount codes for checkout."
      columns={columns}
      filters={[
        {
          field: "active",
          label: "Status",
          type: "select",
          options: [
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ],
        },
      ]}
      createHref="/coupons/create"
      createLabel="New coupon"
      empty="No coupons yet."
    />
  );
}
