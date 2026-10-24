"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDateTime, humanize, money } from "@/lib/format";
import { cn } from "@/lib/cn";

type Entry = components["schemas"]["AccountLedgerEntryOut"];

const columns: Column<Entry>[] = [
  {
    key: "when",
    header: "When",
    cell: (e) => <span className="text-xs md:text-sm">{formatDateTime(e.created_at)}</span>,
  },
  { key: "type", header: "Entry", cell: (e) => <Badge>{humanize(e.entry_type)}</Badge> },
  {
    key: "amount",
    header: "Amount",
    className: "text-right tabular-nums",
    cell: (e) => (
      <span className={cn("font-medium", e.amount < 0 ? "text-drs-maroon" : "text-drs-green")}>
        {e.amount > 0 ? "+" : ""}
        {money(e.amount)}
      </span>
    ),
  },
  {
    key: "balance",
    header: "Balance after",
    className: "text-right tabular-nums",
    cell: (e) => money(e.balance_after),
  },
  {
    key: "ref",
    header: "Reference",
    hideOnMobile: true,
    cell: (e) => (e.ref_type ? `${humanize(e.ref_type)}${e.ref_id ? ` #${e.ref_id}` : ""}` : "—"),
  },
];

export function LedgerTable({
  resource,
  accountId,
  caption,
}: {
  resource: "wallet-transactions" | "credit-ledger";
  accountId: number;
  caption: string;
}) {
  return (
    <ResourceList<Entry>
      embedded
      resource={resource}
      title={caption}
      caption={caption}
      columns={columns}
      meta={{ accountId }}
      empty="No entries yet."
    />
  );
}
