import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { GiftCardsView } from "@/components/store/gift-cards-view";

export const metadata: Metadata = { title: "Gift cards" };

export default function GiftCardsPage() {
  return (
    <>
      <AccountHeading title="Gift cards" intro="Check a balance or add a gift card to your wallet." />
      <GiftCardsView />
    </>
  );
}
