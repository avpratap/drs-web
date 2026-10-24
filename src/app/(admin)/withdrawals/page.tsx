"use client";

import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { money } from "@/lib/format";
import { billingActions } from "@/modules/billing/actions";
import { OPTIONS } from "@/modules/options";

type Withdrawal = components["schemas"]["WithdrawalAdminOut"];

const columns: Column<Withdrawal>[] = [
  { key: "id", header: "Request", cell: (w) => <span className="font-medium">#{w.id}</span> },
  {
    key: "account",
    header: "Account",
    cell: (w) => <TextLink href={`/accounts/${w.account_id}`}>Account #{w.account_id}</TextLink>,
  },
  { key: "amount", header: "Amount", className: "tabular-nums", cell: (w) => money(w.amount) },
  { key: "status", header: "Status", cell: (w) => <StatusBadge status={w.status} /> },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (w) =>
      w.status === "requested" ? (
        <div className="flex justify-end gap-1">
          <ActionDialog
            label="Approve"
            variant="ghost"
            title={`Approve withdrawal #${w.id}?`}
            description={`${money(w.amount)} will be debited from account #${w.account_id}'s wallet and marked paid.`}
            onConfirm={() => billingActions.approveWithdrawal(w.id)}
            success="Withdrawal approved"
            invalidate={["withdrawals"]}
          />
          <ActionDialog
            label="Reject"
            variant="ghost"
            triggerClassName="text-drs-maroon hover:bg-drs-maroon/10"
            confirmVariant="danger"
            title={`Reject withdrawal #${w.id}?`}
            description="The wallet is not debited."
            onConfirm={() => billingActions.rejectWithdrawal(w.id)}
            success="Withdrawal rejected"
            invalidate={["withdrawals"]}
          />
        </div>
      ) : (
        <span className="text-drs-ink/70">—</span>
      ),
  },
];

export default function WithdrawalsPage() {
  return (
    <ResourceList<Withdrawal>
      resource="withdrawals"
      title="Withdrawals"
      description="Customer wallet payout requests awaiting approval."
      columns={columns}
      filters={[{ field: "status", label: "Status", type: "select", options: OPTIONS.withdrawalStatus }]}
      initialFilters={[{ field: "status", operator: "eq", value: "requested" }]}
      empty="No withdrawal requests."
    />
  );
}
