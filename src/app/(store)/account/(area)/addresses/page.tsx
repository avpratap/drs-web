import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { AddressBook } from "@/components/store/address-book";

export const metadata: Metadata = { title: "Addresses" };

export default function AddressesPage() {
  return (
    <>
      <AccountHeading
        title="Addresses"
        intro="Where we deliver. Your default address is picked at checkout."
      />
      <AddressBook />
    </>
  );
}
