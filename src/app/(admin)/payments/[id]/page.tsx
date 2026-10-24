"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ActionDialog } from "@/components/resource/action-dialog";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { formatDateTime, humanize, money } from "@/lib/format";
import { listHref } from "@/lib/list-href";
import { billingActions } from "@/modules/billing/actions";

type Payment = components["schemas"]["PaymentOut"];

export default function PaymentShowPage() {
  const { id } = useParams<{ id: string }>();
  const { result: p, query } = useOne<Payment>({ resource: "payments", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !p) return <Card>{query.error?.message ?? "Payment not found."}</Card>;
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/payments">Payments</BackLink>}
        title={`Payment #${p.id}`}
        actions={
          <>
            <ButtonLink variant="secondary" href={listHref("/refunds", { payment_id: p.id })}>
              Refunds
            </ButtonLink>
            <ActionDialog
              label="Refund"
              variant="danger"
              confirmVariant="danger"
              disabled={p.status !== "success"}
              title={`Refund payment #${p.id}`}
              description={`Leave the amount empty to refund the full ${money(p.amount)}.`}
              fields={[
                {
                  name: "amount",
                  label: "Amount (₹)",
                  type: "money",
                  gt: 0,
                  max: p.amount,
                  hint: `Up to ${money(p.amount)}`,
                },
                { name: "reason", label: "Reason", type: "textarea", maxLength: 255 },
              ]}
              onConfirm={(v) => billingActions.refundPayment(p.id, v)}
              success="Refund initiated"
              invalidate={["payments", "refunds"]}
            />
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "Status", value: <StatusBadge status={p.status} /> },
            { label: "Amount", value: money(p.amount) },
            { label: "Type", value: <Badge>{humanize(p.payment_type)}</Badge> },
            { label: "Gateway", value: humanize(p.gateway) },
            {
              label: "Gateway order",
              value: <span className="font-mono text-xs">{p.gateway_order_id ?? "—"}</span>,
            },
            { label: "For", value: p.ref_type ? `${humanize(p.ref_type)} #${p.ref_id ?? ""}` : "—" },
            {
              label: "Account",
              value: <TextLink href={`/accounts/${p.account_id}`}>#{p.account_id}</TextLink>,
            },
            { label: "Created", value: formatDateTime(p.created_at) },
          ]}
        />
      </Card>
    </>
  );
}
