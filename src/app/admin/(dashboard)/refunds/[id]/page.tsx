"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ActionDialog } from "@/components/resource/action-dialog";
import { StatusBadge } from "@/components/ui/badge";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { formatDateTime, money } from "@/lib/format";
import { billingActions } from "@/modules/billing/actions";
import { OPTIONS } from "@/modules/options";

type Refund = components["schemas"]["app__api__v1__admin_sales__RefundOut"];

export default function RefundShowPage() {
  const { id } = useParams<{ id: string }>();
  const { result: r, query } = useOne<Refund>({ resource: "refunds", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !r) return <Card>{query.error?.message ?? "Refund not found."}</Card>;
  const open = r.status === "initiated" || r.status === "pending";
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/admin/refunds">Refunds</BackLink>}
        title={`Refund #${r.id}`}
        actions={
          <ActionDialog
            label="Reconcile"
            variant="primary"
            disabled={!open}
            description="Record the gateway's final outcome for this refund."
            fields={[
              {
                name: "outcome",
                label: "Outcome",
                type: "select",
                options: OPTIONS.refundOutcome,
                required: true,
              },
              { name: "gateway_refund_id", label: "Gateway refund ID", maxLength: 128 },
            ]}
            onConfirm={(v) => billingActions.reconcileRefund(r.id, v)}
            success="Refund reconciled"
            invalidate={["refunds", "payments"]}
          />
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "Status", value: <StatusBadge status={r.status} /> },
            { label: "Amount", value: money(r.amount) },
            {
              label: "Payment",
              value: <TextLink href={`/admin/payments/${r.payment_id}`}>#{r.payment_id}</TextLink>,
            },
            {
              label: "Account",
              value: <TextLink href={`/admin/accounts/${r.account_id}`}>#{r.account_id}</TextLink>,
            },
            { label: "Reason", value: r.reason ?? "—" },
            { label: "Created", value: formatDateTime(r.created_at) },
          ]}
        />
      </Card>
    </>
  );
}
