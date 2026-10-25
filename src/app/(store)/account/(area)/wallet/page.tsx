import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { WalletView } from "@/components/store/wallet-view";
import { paymentsEnabled } from "@/lib/payments";

export const metadata: Metadata = { title: "Wallet" };

export default function WalletPage() {
  return (
    <>
      <AccountHeading title="Wallet" intro="Your balance, top-ups and every transaction." />
      <WalletView paymentsEnabled={paymentsEnabled()} />
    </>
  );
}
