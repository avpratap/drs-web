"use client";

import { useParams } from "next/navigation";
import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { couponFields } from "@/modules/customers/fields";

export default function CouponEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader eyebrow={<BackLink href={`/coupons/${id}`}>Coupon</BackLink>} title="Edit coupon" />
      <ResourceForm resource="coupons" id={id} fields={couponFields} cancelHref={`/coupons/${id}`} />
    </>
  );
}
