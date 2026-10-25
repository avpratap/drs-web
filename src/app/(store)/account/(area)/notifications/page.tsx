import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { NotificationsView } from "@/components/store/notifications-view";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <>
      <AccountHeading title="Notifications" intro="Order, delivery and wallet updates." />
      <NotificationsView />
    </>
  );
}
