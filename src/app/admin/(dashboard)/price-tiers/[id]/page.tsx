"use client";

import { useOne } from "@refinedev/core";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TierTypeBadge } from "@/components/catalog/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import type { components } from "@/lib/api/client";

type Tier = components["schemas"]["PriceTierOut"];

export default function PriceTierShowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { result: tier, query } = useOne<Tier>({ resource: "price-tiers", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !tier) return <Card>{query.error?.message ?? "Tier not found."}</Card>;
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/price-tiers" className="hover:underline">
            ← Price tiers
          </Link>
        }
        title={tier.name}
        actions={
          <>
            <ButtonLink href={`/admin/price-tiers/${tier.id}/edit`}>Edit</ButtonLink>
            <DeleteButton
              resource="price-tiers"
              id={tier.id}
              label="Delete tier"
              confirmText="Tiers that still have product prices can't be deleted."
              onDone={() => router.push("/admin/price-tiers")}
            />
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "Code", value: tier.code },
            { label: "Name", value: tier.name },
            { label: "Type", value: <TierTypeBadge type={tier.tier_type} /> },
          ]}
        />
      </Card>
    </>
  );
}
