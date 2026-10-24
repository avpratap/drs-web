"use client";

import { useTable } from "@refinedev/core";
import Link from "next/link";
import { TierTypeBadge } from "@/components/catalog/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";

type Tier = components["schemas"]["PriceTierOut"];

const columns: Column<Tier>[] = [
  {
    key: "code",
    header: "Code",
    cell: (t) => (
      <Link href={`/price-tiers/${t.id}`} className="font-medium text-drs-green hover:underline">
        {t.code}
      </Link>
    ),
  },
  { key: "name", header: "Name", cell: (t) => t.name },
  { key: "type", header: "Type", cell: (t) => <TierTypeBadge type={t.tier_type} /> },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (t) => (
      <Link
        href={`/price-tiers/${t.id}/edit`}
        className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-drs-green hover:underline"
      >
        Edit<span className="sr-only"> {t.code}</span>
      </Link>
    ),
  },
];

export default function PriceTierListPage() {
  const { result, tableQuery } = useTable<Tier>({
    resource: "price-tiers",
    pagination: { mode: "off" },
    syncWithLocation: false,
  });
  return (
    <>
      <PageHeader
        title="Price tiers"
        description="Customer segments that product prices are set against."
        actions={<ButtonLink href="/price-tiers/create">New tier</ButtonLink>}
      />
      <DataTable
        caption="Price tiers"
        columns={columns}
        rows={result.data}
        rowKey={(t) => t.id}
        loading={tableQuery.isLoading}
        error={tableQuery.error?.message}
        empty="No price tiers yet."
      />
    </>
  );
}
