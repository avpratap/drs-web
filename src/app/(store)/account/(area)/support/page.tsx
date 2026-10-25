import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { SupportList } from "@/components/store/support-view";

export const metadata: Metadata = { title: "Help & support" };

export default function SupportPage() {
  return (
    <>
      <AccountHeading
        title="Help & support"
        intro="Ask us anything about your orders, deliveries or wallet."
      />
      <SupportList />
    </>
  );
}
