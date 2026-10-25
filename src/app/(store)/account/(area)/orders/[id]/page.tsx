import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccountHeading } from "@/components/store/account-heading";
import { OrderDetail, OrdersSkeleton } from "@/components/store/orders-view";
import { paymentsEnabled } from "@/lib/payments";

export const metadata: Metadata = { title: "Order details" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function Detail({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const orderId = Number(id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) notFound();
  return <OrderDetail id={orderId} placed={sp.placed === "1"} paymentsEnabled={paymentsEnabled()} />;
}

export default function OrderPage(props: Props) {
  return (
    <>
      <AccountHeading title="Order details" back={{ href: "/account/orders", label: "Your orders" }} />
      <Suspense fallback={<OrdersSkeleton rows={4} />}>
        <Detail {...props} />
      </Suspense>
    </>
  );
}
