import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { OrdersList } from "@/components/store/orders-view";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <>
      <AccountHeading title="Your orders" intro="Track deliveries, download invoices and pay what's due." />
      <OrdersList />
    </>
  );
}
