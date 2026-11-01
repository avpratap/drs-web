"use client";

import { useOne } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import { ActionDialog } from "@/components/resource/action-dialog";
import { InvoicePdfButton } from "@/components/billing/invoice-pdf";
import { ItemsTable } from "@/components/inventory/items-table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { formatQty, money } from "@/lib/format";
import { formatDate } from "@/lib/forms";
import { useAccountOptions } from "@/modules/engagement/use-account-options";
import type { Invoice } from "@/modules/insights/handlers";
import { operationsActions } from "@/modules/operations/handlers";

type Line = components["schemas"]["InvoiceLineOut"];

export default function InvoiceShowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const accounts = useAccountOptions();
  const { result: i, query } = useOne<Invoice>({ resource: "invoices", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !i) return <Card>{query.error?.message ?? "Invoice not found."}</Card>;
  const gst = i.cgst + i.sgst + i.igst;

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/admin/invoices">Invoices</BackLink>}
        title={i.invoice_no}
        description={`${i.is_credit_note ? "Credit note" : "Tax invoice"} · ${formatDate(i.invoice_date)} · FY ${i.fy}`}
        actions={
          <>
            {!i.is_credit_note && i.status === "issued" && (
              <ActionDialog
                label="Issue credit note"
                confirmVariant="danger"
                title={`Credit note against ${i.invoice_no}?`}
                description="Reverses this invoice in full with a GST credit note and reduces what the account owes. It can't be undone."
                fields={[{ name: "reason", label: "Reason", type: "textarea", maxLength: 255, rows: 3 }]}
                toBody={(v) => ({ reason: String(v.reason ?? "").trim() || null })}
                onConfirm={async (v) => {
                  const note = await operationsActions.creditNote(i.id, v.reason as string | null);
                  router.push(`/admin/invoices/${note.id}`);
                }}
                success="Credit note issued"
                invalidate={["invoices"]}
              />
            )}
            <InvoicePdfButton invoiceId={i.id} variant="primary" />
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            {
              label: "Type",
              value: i.is_credit_note ? <Badge tone="maroon">Credit note</Badge> : <Badge>Tax invoice</Badge>,
            },
            { label: "Status", value: <StatusBadge status={i.status} /> },
            {
              label: "Account",
              value: (
                <TextLink href={`/admin/accounts/${i.account_id}`}>{accounts.name(i.account_id)}</TextLink>
              ),
            },
            {
              label: "For",
              value: i.order_id ? (
                <TextLink href={`/admin/orders/${i.order_id}`}>Order #{i.order_id}</TextLink>
              ) : i.delivery_order_id ? (
                <TextLink href={`/admin/delivery/${i.delivery_order_id}`}>
                  Delivery #{i.delivery_order_id}
                </TextLink>
              ) : (
                "—"
              ),
            },
            ...(i.original_invoice_id
              ? [
                  {
                    label: "Against invoice",
                    value: (
                      <TextLink href={`/admin/invoices/${i.original_invoice_id}`}>
                        #{i.original_invoice_id}
                      </TextLink>
                    ),
                  },
                ]
              : []),
            { label: "Place of supply", value: i.place_of_supply ?? "—" },
            { label: "Seller GSTIN", value: i.seller_gstin ?? "—" },
            { label: "Buyer GSTIN", value: i.buyer_gstin ?? "Unregistered" },
            { label: "Taxable value", value: money(i.taxable_value) },
            {
              label: i.is_interstate ? "IGST" : "CGST + SGST",
              value: i.is_interstate ? money(i.igst) : `${money(i.cgst)} + ${money(i.sgst)}`,
            },
            { label: "Total", value: <span className="font-semibold">{money(i.total)}</span> },
          ]}
        />
      </Card>
      <ItemsTable<Line>
        caption="Lines"
        rows={i.lines ?? []}
        columns={[
          {
            key: "d",
            header: "Item",
            cell: (l) => (
              <span>
                {l.description ?? "—"}
                {l.hsn_code && <span className="block text-xs text-drs-ink/70">HSN {l.hsn_code}</span>}
              </span>
            ),
          },
          { key: "q", header: "Qty", className: "tabular-nums", cell: (l) => formatQty(l.qty) },
          {
            key: "u",
            header: "Rate",
            className: "tabular-nums",
            hideOnMobile: true,
            cell: (l) => money(l.unit_price),
          },
          {
            key: "g",
            header: "GST",
            className: "tabular-nums",
            hideOnMobile: true,
            cell: (l) => `${l.gst_rate}%`,
          },
          { key: "t", header: "Amount", className: "tabular-nums", cell: (l) => money(l.line_total) },
        ]}
      />
      <p className="mt-4 text-right text-sm text-drs-ink/75">
        Taxable {money(i.taxable_value)} + GST {money(gst)} ={" "}
        <span className="font-semibold text-drs-ink">{money(i.total)}</span>
      </p>
    </>
  );
}
