import type { Metadata } from "next";
import { AccountHeading } from "@/components/store/account-heading";
import { ProfileForm } from "@/components/store/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <>
      <AccountHeading title="Profile" intro="Your details, invoice information and how we keep in touch." />
      <ProfileForm />
    </>
  );
}
