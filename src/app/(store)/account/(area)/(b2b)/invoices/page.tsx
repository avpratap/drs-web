import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { InvoicesView } from "@/components/store/b2b/invoices-view";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return (
    <>
      <AccountHeading
        title="Invoices"
        intro="GST invoices for your deliveries and your credit statement. Both cover every shop on your billing account."
      />
      <InvoicesView />
    </>
  );
}
