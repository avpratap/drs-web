"use client";

import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { engagementActions } from "@/modules/engagement/handlers";
import { useAccountOptions } from "@/modules/engagement/use-account-options";
import { OPTIONS } from "@/modules/options";

type Row = components["schemas"]["LoyaltyAccountAdminOut"] & { id: number };

const points = (n: number) => n.toLocaleString("en-IN");

export default function LoyaltyPage() {
  const accounts = useAccountOptions();
  const columns: Column<Row>[] = [
    {
      key: "account",
      header: "Account",
      cell: (r) => (
        <TextLink href={`/admin/accounts/${r.account_id}`}>{accounts.name(r.account_id)}</TextLink>
      ),
    },
    {
      key: "points",
      header: "Points",
      className: "tabular-nums",
      cell: (r) => <span className="font-semibold text-drs-green">{points(r.points_balance)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (r) => (
        <ActionDialog
          label="Adjust"
          ariaLabel={`Adjust points for ${accounts.name(r.account_id)}`}
          variant="ghost"
          title={`Adjust points · ${accounts.name(r.account_id)}`}
          description={`Current balance: ${points(r.points_balance)} points. Use a negative number to deduct.`}
          defaultValues={{ reason: "adjust" }}
          fields={[
            {
              name: "points",
              label: "Points (+/−)",
              type: "number",
              required: true,
              step: 1,
              validate: (v) => {
                const n = v as number;
                if (!Number.isInteger(n)) return "Whole points only";
                if (n === 0) return "Enter a non-zero amount";
                if (r.points_balance + n < 0) return `Can't deduct more than ${points(r.points_balance)}`;
                return true;
              },
            },
            {
              name: "reason",
              label: "Reason",
              type: "select",
              required: true,
              options: OPTIONS.pointsReason,
            },
          ]}
          onConfirm={(v) => engagementActions.adjustPoints(r.account_id, v)}
          success="Points adjusted"
          invalidate={["loyalty"]}
        />
      ),
    },
  ];
  return (
    <ResourceList<Row>
      resource="loyalty"
      title="Loyalty points"
      description="Points balances per customer account, highest first. Adjustments are recorded in the account's points ledger."
      columns={columns}
      empty="No loyalty accounts yet."
    />
  );
}
