"use client";

import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { couponFields } from "@/modules/customers/fields";

export default function CouponCreatePage() {
  return (
    <>
      <PageHeader eyebrow={<BackLink href="/admin/coupons">Coupons</BackLink>} title="New coupon" />
      <ResourceForm
        resource="coupons"
        fields={couponFields}
        defaultValues={{ discount_type: "percent", min_order_value: 0 }}
        cancelHref="/admin/coupons"
        submitLabel="Create coupon"
        transform={(p) => (typeof p.code === "string" ? { ...p, code: p.code.toUpperCase() } : p)}
      />
    </>
  );
}
