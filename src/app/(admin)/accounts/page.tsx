"use client";

import { AccountTypeBadge, BillingModeLabel } from "@/components/billing/account-type-badge";
import { ResourceList } from "@/components/resource/resource-list";
import { RowLink, TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";

type Account = components["schemas"]["AccountRow"];

const columns: Column<Account>[] = [
  {
    key: "account",
    header: "Account",
    cell: (a) => (
      <TextLink href={`/accounts/${a.id}`} sub={a.phone ?? `User #${a.owner_user_id}`}>
        {a.full_name || `Account #${a.id}`}
      </TextLink>
    ),
  },
  { key: "type", header: "Type", cell: (a) => <AccountTypeBadge type={a.account_type} /> },
  {
    key: "mode",
    header: "Billing",
    cell: (a) => <BillingModeLabel mode={a.billing_mode} />,
    hideOnMobile: true,
  },
  {
    key: "tier",
    header: "Price tier",
    cell: (a) => (a.price_tier_id ? `#${a.price_tier_id}` : "Default"),
    hideOnMobile: true,
  },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (a) => (
      <RowLink href={`/accounts/${a.id}`} srLabel={`account ${a.id}`}>
        Open
      </RowLink>
    ),
  },
];

export default function AccountsPage() {
  return (
    <ResourceList<Account>
      resource="accounts"
      title="Accounts & wallets"
      description="Customer billing accounts: wallet balances, credit, top-ups and settlements."
      columns={columns}
      filters={[{ field: "q", label: "Search by name or phone", type: "search" }]}
      empty="No accounts match."
    />
  );
}
