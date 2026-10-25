import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { WishlistView } from "@/components/store/wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <>
      <AccountHeading title="Wishlist" intro="Products you've saved for later." />
      <WishlistView />
    </>
  );
}
