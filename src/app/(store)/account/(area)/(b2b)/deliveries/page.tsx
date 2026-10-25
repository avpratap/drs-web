import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { DeliveriesView } from "@/components/store/b2b/deliveries-view";

export const metadata: Metadata = { title: "Deliveries" };

export default function DeliveriesPage() {
  return (
    <>
      <AccountHeading title="Deliveries" intro="What's coming to your shop, day by day." />
      <DeliveriesView />
    </>
  );
}
