import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { ShopsView } from "@/components/store/b2b/shops-view";

export const metadata: Metadata = { title: "Shops" };

export default function ShopsPage() {
  return (
    <>
      <AccountHeading title="Shops" intro="The places we deliver to. Each has its own standing order." />
      <ShopsView />
    </>
  );
}
