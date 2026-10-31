"use client";

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { detailOf } from "./cart";
import { PaymentPanel } from "./payment-panel";
import { rupees } from "./product-card";

type Billing = components["schemas"]["BillingSummary"];
type Txn = components["schemas"]["WalletTxnLineOut"];

export const TXNS_PER_PAGE = 20;

/**
 * Pager state for one page of transactions. With X-Total-Count it's exact; without it (a proxy
 * may strip the header), a full page means there may be more — the same has-next heuristic as
 * the B2B lists — instead of treating the page as the whole history.
 */
export function txnPager(page: number, rows: number, total: number | null) {
  const from = rows ? (page - 1) * TXNS_PER_PAGE + 1 : 0;
  const to = rows ? from + rows - 1 : 0;
  return total === null
    ? { hasOlder: rows === TXNS_PER_PAGE, label: rows ? `${from}–${to}` : "" }
    : { hasOlder: page * TXNS_PER_PAGE < total, label: `${from}–${to} of ${total}` };
}
export const TOPUP_PRESETS = [200, 500, 1000, 2000] as const;
export const TOPUP_MIN = 100;
export const TOPUP_MAX = 50_000;

const CREDIT_TYPES = new Set([
  "topup",
  "credit",
  "refund",
  "cashback",
  "reversal",
  "adjustment_credit",
  "gift_card",
]);

/** "Money added" / "Order payment" etc., and whether it adds to the balance. */
export function txnView(t: Pick<Txn, "txn_type" | "ref_type" | "ref_id">): {
  label: string;
  ref: string | null;
  credit: boolean;
} {
  const credit = CREDIT_TYPES.has(t.txn_type);
  const labels: Record<string, string> = {
    topup: "Money added",
    refund: "Refund",
    cashback: "Cashback",
    credit: "Credit",
    debit: t.ref_type === "order" ? "Order payment" : "Payment",
    withdrawal: "Withdrawal",
  };
  const base = labels[t.txn_type] ?? t.txn_type.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  return { label: base, ref: t.ref_type === "order" && t.ref_id ? `Order #${t.ref_id}` : null, credit };
}

const when = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

function TopUp({ enabled, onAdded }: { enabled: boolean; onAdded: (amount: number) => void }) {
  const id = useId();
  const [amount, setAmount] = useState<number>(500);
  const [custom, setCustom] = useState("");
  const value = custom ? Number(custom) : amount;
  const valid = Number.isFinite(value) && value >= TOPUP_MIN && value <= TOPUP_MAX;

  if (!enabled)
    return <PaymentPanel purpose={{ kind: "topup" }} total={0} enabled={false} onPaid={() => {}} />;
  return (
    <section
      aria-labelledby={`${id}-h`}
      className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
    >
      <h2 id={`${id}-h`} className="text-lg font-semibold text-drs-ink">
        Add money
      </h2>
      <fieldset className="mt-3">
        <legend className="sr-only">Choose an amount</legend>
        <div className="flex flex-wrap gap-2">
          {TOPUP_PRESETS.map((v) => {
            const on = !custom && amount === v;
            return (
              <label
                key={v}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center rounded-full border-2 px-4 text-sm font-semibold transition-colors focus-ring-within",
                  on
                    ? "border-drs-green bg-drs-green/5 text-drs-green"
                    : "border-drs-ink/15 text-drs-ink hover:border-drs-green/50",
                )}
              >
                <input
                  type="radio"
                  name={`${id}-amt`}
                  className="sr-only"
                  checked={on}
                  onChange={() => {
                    setAmount(v);
                    setCustom("");
                  }}
                />
                {rupees(v)}
              </label>
            );
          })}
        </div>
      </fieldset>
      <label htmlFor={`${id}-custom`} className="mt-4 block text-sm font-medium text-drs-ink">
        Or enter an amount
      </label>
      <div className="relative mt-1.5 max-w-xs">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-drs-ink/70"
        >
          ₹
        </span>
        <input
          id={`${id}-custom`}
          inputMode="numeric"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 6))}
          aria-invalid={(!!custom && !valid) || undefined}
          aria-describedby={`${id}-hint`}
          className="block min-h-11 w-full rounded-lg border border-drs-ink/20 bg-drs-white py-2 pr-3 pl-7 text-sm text-drs-ink hover:border-drs-green/50 focus-visible:border-drs-green aria-[invalid=true]:border-drs-maroon"
        />
      </div>
      <p
        id={`${id}-hint`}
        className={cn("mt-1.5 text-xs", custom && !valid ? "text-drs-maroon" : "text-drs-ink/70")}
      >
        Between {rupees(TOPUP_MIN)} and {rupees(TOPUP_MAX)}.
      </p>
      {valid && (
        <div className="mt-4">
          <PaymentPanel
            key={value}
            purpose={{ kind: "topup" }}
            total={value}
            enabled
            onPaid={() => onAdded(value)}
          />
        </div>
      )}
    </section>
  );
}

export function WalletView({ paymentsEnabled }: { paymentsEnabled: boolean }) {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [page, setPage] = useState(1);
  const [txns, setTxns] = useState<{ page: number; rows: Txn[]; total: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  const loadBilling = useCallback(async () => {
    const { data, error: e } = await api.GET("/api/v1/billing/me");
    return data ? { data, error: null } : { data: null, error: detailOf(e) ?? "Couldn't load your wallet." };
  }, []);
  const loadTxns = useCallback(async (p: number) => {
    const { data, response } = await api.GET("/api/v1/billing/transactions", {
      params: { query: { limit: TXNS_PER_PAGE, offset: (p - 1) * TXNS_PER_PAGE } },
    });
    const header = response.headers.get("x-total-count");
    return { page: p, rows: data ?? [], total: header === null ? null : Number(header) };
  }, []);

  useEffect(() => {
    let live = true;
    void loadBilling()
      .then((r) => {
        if (!live) return;
        setBilling(r.data);
        setError(r.error);
      })
      .catch(() => live && setError("You seem to be offline."));
    return () => {
      live = false;
    };
  }, [loadBilling]);
  useEffect(() => {
    let live = true;
    void loadTxns(page)
      .then((t) => live && setTxns(t))
      .catch(() => live && setTxns({ page, rows: [], total: null }));
    return () => {
      live = false;
    };
  }, [loadTxns, page]);

  if (error)
    return (
      <p
        role="alert"
        className="rounded-2xl border border-dashed border-drs-maroon/30 bg-drs-white px-6 py-10 text-center text-sm text-drs-maroon"
      >
        {error}
      </p>
    );

  const pager = txns ? txnPager(txns.page, txns.rows.length, txns.total) : null;

  return (
    <div className="space-y-4">
      {billing ? (
        <div className="rounded-2xl bg-drs-green p-5 text-drs-cream shadow-sm md:p-6">
          <p className="flex items-center gap-2 text-sm text-drs-cream/85">
            <WalletIcon aria-hidden className="size-4" /> Wallet balance
          </p>
          <p className="mt-2 text-4xl font-semibold tabular-nums" data-testid="wallet-balance">
            {rupees(billing.wallet_balance)}
          </p>
          <p className="mt-2 text-sm text-drs-cream/85">
            Used automatically for your subscription deliveries.
          </p>
          {billing.credit_outstanding > 0 && (
            <p className="mt-3 inline-block rounded-full bg-drs-cream/15 px-3 py-1 text-sm">
              Credit outstanding: {rupees(billing.credit_outstanding)}
            </p>
          )}
        </div>
      ) : (
        <div
          aria-busy="true"
          aria-label="Loading wallet"
          className="h-40 animate-pulse rounded-2xl bg-drs-ink/[0.06] motion-reduce:animate-none"
        />
      )}

      {added != null && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-drs-green/10 px-4 py-3 text-sm font-medium text-drs-green"
        >
          <CheckCircle2Icon aria-hidden className="size-4" /> {rupees(added)} added to your wallet.
        </p>
      )}

      <TopUp
        enabled={paymentsEnabled}
        onAdded={async (amount) => {
          setAdded(amount);
          const [b, t] = await Promise.all([loadBilling(), loadTxns(1)]);
          setBilling(b.data);
          setPage(1);
          setTxns(t);
        }}
      />

      <section
        aria-labelledby="txns-heading"
        className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
      >
        <h2 id="txns-heading" className="text-lg font-semibold text-drs-ink">
          Transactions
        </h2>
        {!txns || txns.page !== page ? (
          <div aria-busy="true" aria-label="Loading transactions" className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-xl bg-drs-ink/[0.06] motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : txns.rows.length === 0 ? (
          <p className="mt-3 text-sm text-drs-ink/75">No transactions yet.</p>
        ) : (
          <>
            <ul aria-label="Wallet transactions" className="mt-2 divide-y divide-drs-ink/10">
              {txns.rows.map((t) => {
                const v = txnView(t);
                const Icon = v.credit ? ArrowDownLeftIcon : ArrowUpRightIcon;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full",
                        v.credit ? "bg-drs-green/10 text-drs-green" : "bg-drs-ink/5 text-drs-ink/70",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-drs-ink">{v.label}</span>
                      <span className="block text-xs text-drs-ink/70">
                        {when.format(new Date(t.created_at))}
                        {v.ref && ` · ${v.ref}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span
                        className={cn(
                          "block text-sm font-semibold tabular-nums",
                          v.credit ? "text-drs-green" : "text-drs-ink",
                        )}
                      >
                        {v.credit ? "+" : "−"}
                        {rupees(Math.abs(t.amount))}
                      </span>
                      <span className="block text-xs text-drs-ink/70 tabular-nums">
                        Bal {rupees(t.balance_after)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <nav
              aria-label="Transaction pages"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-drs-ink/10 pt-4 text-sm"
            >
              <span className="text-drs-ink/75">{pager?.label}</span>
              <span className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full border border-drs-ink/15 px-4 font-medium text-drs-ink hover:border-drs-green/50 disabled:opacity-40"
                >
                  <ChevronLeftIcon aria-hidden className="size-4" /> Newer
                </button>
                <button
                  type="button"
                  disabled={!pager?.hasOlder}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full border border-drs-ink/15 px-4 font-medium text-drs-ink hover:border-drs-green/50 disabled:opacity-40"
                >
                  Older <ChevronRightIcon aria-hidden className="size-4" />
                </button>
              </span>
            </nav>
          </>
        )}
      </section>
    </div>
  );
}
