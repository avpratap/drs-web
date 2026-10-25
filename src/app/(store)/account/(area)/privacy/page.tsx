import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { PrivacyView } from "@/components/store/privacy-view";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <AccountHeading
        title="Privacy & your data"
        intro="Control how we use your data, download it, or delete your account."
      />
      <PrivacyView />
    </>
  );
}
