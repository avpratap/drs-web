import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { SubscriptionsView } from "@/components/store/b2b/subscriptions-view";

export const metadata: Metadata = { title: "Subscriptions" };

export default function SubscriptionsPage() {
  return (
    <>
      <AccountHeading
        title="Subscriptions"
        intro="Standing orders for your shops — delivered fresh before 7 am."
      />
      <SubscriptionsView />
    </>
  );
}
