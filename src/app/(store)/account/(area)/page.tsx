import type { Metadata } from "next";
import { AccountOverview } from "@/components/store/account-overview";

export const metadata: Metadata = { title: "Overview" };

export default function AccountPage() {
  return <AccountOverview />;
}
