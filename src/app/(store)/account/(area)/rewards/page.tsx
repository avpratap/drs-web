import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { RewardsView } from "@/components/store/rewards-view";

export const metadata: Metadata = { title: "Rewards" };

export default function RewardsPage() {
  return (
    <>
      <AccountHeading title="Rewards" intro="Your DRS points, and rewards for bringing friends along." />
      <RewardsView />
    </>
  );
}
