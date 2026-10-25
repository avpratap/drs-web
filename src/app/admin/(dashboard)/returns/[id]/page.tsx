"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ItemsTable } from "@/components/inventory/items-table";
import { ActionDialog } from "@/components/resource/action-dialog";
import { StatusBadge } from "@/components/ui/badge";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import { StatCard, StatGrid } from "@/components/ui/stat";
import type { components } from "@/lib/api/client";
import { formatDate, formatDateTime, formatQty, money } from "@/lib/format";
import { useInventoryLookups } from "@/modules/inventory/lookups";
import { operationsActions } from "@/modules/operations/handlers";

type Detail = components["schemas"]["AdminRMADetailOut"];
type Item = components["schemas"]["RMAItemOut"];
type Credit = components["schemas"]["RMARefundCreditOut"];
type Note = components["schemas"]["RMACreditNoteOut"];

const REFRESH = ["returns", "orders", "wallet-transactions"];

export default function ReturnShowPage() {
  const { id } = useParams<{ id: string }>();
  const lk = useInventoryLookups();
  const { result: r, query } = useOne<Detail>({ resource: "returns", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !r) return <Card>{query.error?.message ?? "Return not found."}</Card>;

  // A refund may pay at most the returned goods' value and what the order can still refund.
  const maxRefund = Math.max(0, Math.min(r.returned_value ?? 0, r.refundable_headroom ?? 0));

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/admin/returns">Returns</BackLink>}
        title={r.rma_no}
        description={
          r.customer_name || r.customer_phone
            ? `${r.customer_name ?? "Customer"}${r.customer_phone ? ` · +91 ${r.customer_phone}` : ""}`
            : undefined
        }
        actions={
          <>
            {r.status === "requested" && (
              <>
                <ActionDialog
                  label="Approve"
                  variant="primary"
                  title={`Approve ${r.rma_no}?`}
                  description="The customer is told the return is accepted. Refund it once the goods are back."
                  onConfirm={() => operationsActions.approveReturn(r.id)}
                  success="Return approved"
                  invalidate={REFRESH}
                />
                <ActionDialog
                  label="Reject"
                  variant="ghost"
                  triggerClassName="text-drs-maroon hover:bg-drs-maroon/10"
                  confirmVariant="danger"
                  title={`Reject ${r.rma_no}?`}
                  description="The note is shown to the customer as the resolution."
                  fields={[{ name: "note", label: "Reason for rejecting", type: "textarea", maxLength: 255 }]}
                  onConfirm={(v) => operationsActions.rejectReturn(r.id, v)}
                  success="Return rejected"
                  invalidate={REFRESH}
                />
              </>
            )}
            {r.status === "approved" && (
              <ActionDialog
                label="Refund"
                variant="primary"
                title={`Refund ${r.rma_no}`}
                description={
                  <>
                    Paid as <strong>wallet store credit</strong>; a GST credit note is issued if the order was
                    invoiced. Up to {money(maxRefund)}.
                  </>
                }
                defaultValues={{ amount: maxRefund || undefined }}
                fields={[
                  {
                    name: "amount",
                    label: "Refund amount (₹)",
                    type: "money",
                    required: true,
                    gt: 0,
                    max: maxRefund,
                    hint: `Returned value ${money(r.returned_value)} · order headroom ${money(r.refundable_headroom)}`,
                  },
                ]}
                onConfirm={(v) => operationsActions.refundReturn(r.id, v)}
                success="Refund credited to the wallet"
                invalidate={REFRESH}
                disabled={maxRefund <= 0}
              />
            )}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Status" value={<StatusBadge status={r.status} />} />
        <StatCard label="Returned value" value={money(r.returned_value)} />
        <StatCard
          label="Refunded"
          value={r.refund_amount ? money(r.refund_amount) : "—"}
          accent={r.status === "refunded"}
        />
        <StatCard label="Still refundable on order" value={money(r.refundable_headroom)} />
      </StatGrid>

      <Card className="mt-6">
        <DescriptionList
          items={[
            {
              label: "Order",
              value: (
                <TextLink href={`/admin/orders/${r.order_id}`}>{r.order_no ?? `#${r.order_id}`}</TextLink>
              ),
            },
            { label: "Order total", value: r.order_total != null ? money(r.order_total) : "—" },
            {
              label: "Order payment",
              value: r.order_payment_status ? <StatusBadge status={r.order_payment_status} /> : "—",
            },
            {
              label: "Account",
              value: <TextLink href={`/admin/accounts/${r.account_id}`}>#{r.account_id}</TextLink>,
            },
            { label: "Customer's reason", value: r.reason ?? "—" },
            { label: "Resolution", value: r.resolution ?? "—" },
            { label: "Raised", value: formatDateTime(r.created_at) },
          ]}
        />
      </Card>

      <ItemsTable<Item>
        caption="Returned items"
        rows={r.items}
        columns={[
          { key: "p", header: "Product", cell: (i) => lk.productName(i.product_id) },
          {
            key: "q",
            header: "Qty",
            className: "tabular-nums",
            cell: (i) => `${formatQty(i.qty)} ${lk.productUom(i.product_id)}`,
          },
          { key: "r", header: "Reason", cell: (i) => i.reason ?? "—" },
        ]}
      />

      <ItemsTable<Credit>
        caption="Store credit paid"
        empty={r.status === "approved" ? "Not refunded yet." : "No store credit paid."}
        rows={r.refund_credits ?? []}
        columns={[
          {
            key: "a",
            header: "Amount",
            className: "tabular-nums font-medium text-drs-green",
            cell: (c) => `+${money(c.amount)}`,
          },
          {
            key: "b",
            header: "Wallet balance after",
            className: "tabular-nums",
            cell: (c) => money(c.balance_after),
          },
          { key: "w", header: "When", cell: (c) => formatDateTime(c.created_at) },
          {
            key: "l",
            header: "Ledger",
            className: "text-right",
            cell: () => <TextLink href={`/admin/accounts/${r.account_id}`}>Wallet ledger</TextLink>,
          },
        ]}
      />

      <ItemsTable<Note>
        caption="GST credit notes on the order"
        empty="No credit notes on this order."
        rows={r.credit_notes ?? []}
        columns={[
          {
            key: "n",
            header: "Credit note",
            cell: (n) => <span className="font-mono text-xs">{n.invoice_no}</span>,
          },
          { key: "d", header: "Date", cell: (n) => formatDate(n.invoice_date) },
          { key: "t", header: "Total", className: "tabular-nums", cell: (n) => money(n.total) },
        ]}
      />
    </>
  );
}
