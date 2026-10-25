import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderDetail, OrdersSkeleton } from "@/components/store/orders-view";
import { paymentsEnabled } from "@/lib/payments";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };

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
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24">
      <nav aria-label="Breadcrumb" className="text-sm text-drs-ink/75">
        <Link
          href="/orders"
          className="inline-flex min-h-11 items-center hover:text-drs-green hover:underline"
        >
          ← Your orders
        </Link>
      </nav>
      <h1 className="mt-1 mb-6 text-[1.75rem] leading-tight font-semibold tracking-tight text-drs-green md:mb-8 md:text-4xl">
        Order details
      </h1>
      <Suspense fallback={<OrdersSkeleton rows={4} />}>
        <Detail {...props} />
      </Suspense>
    </div>
  );
}
