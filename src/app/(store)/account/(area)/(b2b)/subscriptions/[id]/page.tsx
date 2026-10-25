import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccountHeading } from "@/components/store/account-heading";
import { SubscriptionDetailView } from "@/components/store/b2b/subscription-detail";
import { PanelSkeleton } from "@/components/store/use-load";

export const metadata: Metadata = { title: "Standing order" };

type Props = { params: Promise<{ id: string }> };

async function Detail({ params }: Props) {
  const { id } = await params;
  const subId = Number(id);
  if (!Number.isSafeInteger(subId) || subId <= 0) notFound();
  return <SubscriptionDetailView id={subId} />;
}

export default function SubscriptionPage(props: Props) {
  return (
    <>
      <AccountHeading
        title="Standing order"
        back={{ href: "/account/subscriptions", label: "Subscriptions" }}
      />
      <Suspense fallback={<PanelSkeleton rows={3} label="Loading standing order" />}>
        <Detail {...props} />
      </Suspense>
    </>
  );
}
