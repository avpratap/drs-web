"use client";

import { ExternalLinkIcon, FileTextIcon, ReceiptTextIcon, WalletIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { api } from "@/lib/api/browser";
import { formatDate, formatDateTime, money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";
import {
  latestBalance,
  ledgerLabel,
  ledgerReduces,
  type CreditLine,
  type Invoice,
} from "@/modules/store/b2b";
import { detailOf } from "../cart";
import { LoadError, PanelSkeleton } from "../use-load";
import { EmptyState } from "../empty-state";

const PAGE = 20;

type PageCall<T> = (offset: number) => Promise<{ data?: T[]; error?: unknown; response: Response }>;

/** Newest-first rows with "Show more" (offset paging; X-Total-Count when the API sends it). */
function usePaged<T>(fetchPage: PageCall<T>, fallback: string) {
  const [state, setState] = useState<{ rows: T[] | null; more: boolean; error: string | null }>({
    rows: null,
    more: false,
    error: null,
  });
  const [busy, setBusy] = useState(false);
  const read = useCallback(
    async (offset: number) => {
      try {
        const { data, error, response } = await fetchPage(offset);
        if (!data) return { rows: null, total: 0, error: detailOf(error) ?? fallback };
        const header = response.headers.get("x-total-count");
        return { rows: data, total: header === null ? null : Number(header), error: null };
      } catch {
        return { rows: null, total: 0, error: "You seem to be offline." };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the call is fixed for the view
    [],
  );
  useEffect(() => {
    let live = true;
    void read(0).then((r) => {
      if (!live) return;
      setState({
        rows: r.rows,
        error: r.error,
        more: !!r.rows && (r.total === null ? r.rows.length === PAGE : r.rows.length < r.total),
      });
    });
    return () => {
      live = false;
    };
  }, [read]);
  const loadMore = async () => {
    const have = state.rows ?? [];
    setBusy(true);
    const r = await read(have.length);
    setBusy(false);
    if (!r.rows) return setState((s) => ({ ...s, error: r.error }));
    const rows = [...have, ...r.rows];
    setState({ rows, error: null, more: r.total === null ? r.rows.length === PAGE : rows.length < r.total });
  };
  return { ...state, busy, loadMore };
}

function MoreButton({
  more,
  busy,
  onClick,
  what,
}: {
  more: boolean;
  busy: boolean;
  onClick: () => void;
  what: string;
}) {
  if (!more) return null;
  return (
    <div className="mt-4 flex justify-center">
      <Button type="button" variant="secondary" className="rounded-full" disabled={busy} onClick={onClick}>
        {busy ? "Loading…" : `Show more ${what}`}
      </Button>
    </div>
  );
}

function InvoicePdf({ invoice }: { invoice: Invoice }) {
  const [state, setState] = useState<
    { kind: "idle" | "busy" } | { kind: "ready"; url: string } | { kind: "error"; text: string }
  >({ kind: "idle" });
  if (state.kind === "ready")
    return (
      <a
        href={state.url}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass("secondary", "rounded-full")}
      >
        <ExternalLinkIcon aria-hidden className="size-4" /> Open PDF
        <span className="sr-only">for invoice {invoice.invoice_no} (opens in a new tab)</span>
      </a>
    );
  return (
    <div className="flex flex-col items-end">
      <Button
        type="button"
        variant="secondary"
        className="rounded-full"
        disabled={state.kind === "busy"}
        aria-label={`PDF of invoice ${invoice.invoice_no}`}
        onClick={async () => {
          setState({ kind: "busy" });
          try {
            const { data, error } = await api.GET("/api/v1/invoices/{invoice_id}/pdf", {
              params: { path: { invoice_id: invoice.id } },
            });
            const url = mediaUrl(data?.pdf_url);
            setState(
              url
                ? { kind: "ready", url }
                : { kind: "error", text: detailOf(error) ?? "Couldn't open the invoice." },
            );
          } catch {
            setState({ kind: "error", text: "You seem to be offline." });
          }
        }}
      >
        <FileTextIcon aria-hidden className="size-4" />
        {state.kind === "busy" ? "Preparing…" : "PDF"}
      </Button>
      {state.kind === "error" && (
        <p role="alert" className="mt-1 text-xs text-drs-maroon">
          {state.text}
        </p>
      )}
    </div>
  );
}

function InvoiceList() {
  const inv = usePaged(
    (offset) => api.GET("/api/v1/invoices", { params: { query: { limit: PAGE, offset } } }),
    "Couldn't load your invoices.",
  );
  if (inv.error && !inv.rows) return <LoadError text={inv.error} />;
  if (!inv.rows) return <PanelSkeleton rows={2} label="Loading invoices" />;
  if (!inv.rows.length)
    return (
      <EmptyState
        icon={ReceiptTextIcon}
        title="No invoices yet"
        body="A GST invoice is issued for every delivery."
      />
    );
  return (
    <>
      <ul
        aria-label="Invoices"
        className="divide-y divide-drs-ink/10 rounded-2xl border border-drs-ink/10 bg-drs-white px-5 shadow-sm md:px-6"
      >
        {inv.rows.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium text-drs-ink">
                {i.invoice_no}
                {i.is_credit_note && <Badge tone="gold">Credit note</Badge>}
                {i.status !== "issued" && <StatusBadge status={i.status} />}
              </p>
              <p className="text-sm text-drs-ink/75">
                {formatDate(i.invoice_date)} · GST {money(i.cgst + i.sgst + i.igst)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-drs-ink tabular-nums">{money(i.total)}</span>
              <InvoicePdf invoice={i} />
            </div>
          </li>
        ))}
      </ul>
      <MoreButton more={inv.more} busy={inv.busy} onClick={inv.loadMore} what="invoices" />
    </>
  );
}

function CreditStatement() {
  const st = usePaged<CreditLine>(
    (offset) => api.GET("/api/v1/billing/credit-statement", { params: { query: { limit: PAGE, offset } } }),
    "Couldn't load your credit statement.",
  );
  if (st.error && !st.rows) return <LoadError text={st.error} />;
  if (!st.rows) return <PanelSkeleton rows={2} label="Loading credit statement" />;
  if (!st.rows.length)
    return (
      <EmptyState
        icon={WalletIcon}
        title="No credit statement"
        body="Your account isn't on credit terms — deliveries are paid from your wallet."
      />
    );
  const outstanding = latestBalance(st.rows);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-drs-green p-5 text-drs-cream shadow-sm md:p-6">
        <p className="text-sm text-drs-cream/85">Outstanding</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums" data-testid="credit-outstanding">
          {money(outstanding)}
        </p>
        <p className="mt-1 text-sm text-drs-cream/85">
          Charges for deliveries, less payments and credit notes.
        </p>
      </div>
      <ul
        aria-label="Statement lines"
        className="divide-y divide-drs-ink/10 rounded-2xl border border-drs-ink/10 bg-drs-white px-5 shadow-sm md:px-6"
      >
        {st.rows.map((l) => {
          const down = ledgerReduces(l.entry_type);
          return (
            <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="min-w-0">
                <span className="block font-medium text-drs-ink">{ledgerLabel(l.entry_type)}</span>
                <span className="block text-xs text-drs-ink/70">{formatDateTime(l.created_at)}</span>
              </span>
              <span className="text-right">
                <span
                  className={cn("block font-semibold tabular-nums", down ? "text-drs-green" : "text-drs-ink")}
                >
                  {down ? "−" : "+"}
                  {money(Math.abs(l.amount))}
                </span>
                <span className="block text-xs text-drs-ink/70 tabular-nums">
                  Owed {money(l.balance_after)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <MoreButton more={st.more} busy={st.busy} onClick={st.loadMore} what="lines" />
    </div>
  );
}

/** GST invoices for the account's deliveries, and the B2B credit statement. */
export function InvoicesView() {
  return (
    <Tabs
      tabs={[
        { id: "invoices", label: "Invoices", content: <InvoiceList /> },
        { id: "statement", label: "Credit statement", content: <CreditStatement /> },
      ]}
    />
  );
}
