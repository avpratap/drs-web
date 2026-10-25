"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { couponValue } from "@/components/customers/coupon-value";
import { ActionDialog } from "@/components/resource/action-dialog";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { formatDate, money } from "@/lib/format";
import { customerActions } from "@/modules/customers/handlers";

type Coupon = components["schemas"]["CouponOut"];

export default function CouponShowPage() {
  const { id } = useParams<{ id: string }>();
  const { result: c, query } = useOne<Coupon>({ resource: "coupons", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !c) return <Card>{query.error?.message ?? "Coupon not found."}</Card>;
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/admin/coupons">Coupons</BackLink>}
        title={c.code}
        actions={
          <>
            <ButtonLink href={`/admin/coupons/${c.id}/edit`}>Edit</ButtonLink>
            {c.active && (
              <ActionDialog
                label="Deactivate"
                variant="ghost"
                triggerClassName="text-drs-maroon hover:bg-drs-maroon/10"
                confirmVariant="danger"
                title={`Deactivate ${c.code}?`}
                description="Customers can no longer apply it. Orders already placed keep their discount."
                onConfirm={() => customerActions.deactivateCoupon(c.id)}
                success="Coupon deactivated"
                invalidate={["coupons"]}
              />
            )}
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            {
              label: "Status",
              value: c.active ? <Badge tone="green">Active</Badge> : <Badge tone="maroon">Inactive</Badge>,
            },
            { label: "Discount", value: couponValue(c) },
            { label: "Minimum order", value: money(c.min_order_value) },
            {
              label: "Used",
              value: `${c.used_count}${c.usage_limit ? ` of ${c.usage_limit}` : " (no limit)"}`,
            },
            { label: "Per customer", value: c.per_user_limit ?? "No limit" },
            { label: "Valid from", value: formatDate(c.valid_from) },
            { label: "Valid until", value: c.valid_to ? formatDate(c.valid_to) : "Open-ended" },
          ]}
        />
      </Card>
    </>
  );
}
