import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccountHeading } from "@/components/store/account-heading";
import { SupportThread } from "@/components/store/support-view";
import { PanelSkeleton } from "@/components/store/use-load";

export const metadata: Metadata = { title: "Support request" };

type Props = { params: Promise<{ id: string }> };

async function Thread({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return <SupportThread id={id} />;
}

export default function SupportThreadPage(props: Props) {
  return (
    <>
      <AccountHeading title="Support request" back={{ href: "/account/support", label: "All requests" }} />
      <Suspense fallback={<PanelSkeleton rows={2} label="Loading request" />}>
        <Thread {...props} />
      </Suspense>
    </>
  );
}
