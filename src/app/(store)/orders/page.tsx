import type { Metadata } from "next";
import { OrdersList } from "@/components/store/orders-view";

export const metadata: Metadata = { title: "Your orders", robots: { index: false, follow: false } };

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24">
      <h1 className="mb-6 text-[1.75rem] leading-tight font-semibold tracking-tight text-drs-green md:mb-8 md:text-4xl">
        Your orders
      </h1>
      <OrdersList />
    </div>
  );
}
