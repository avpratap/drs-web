"use client";

import { CheckCircle2Icon, GiftIcon } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { detailOf } from "./cart";
import { useAttemptKey } from "./use-attempt-key";
import { rupees } from "./product-card";
import { LoadError, PanelSkeleton, useLoad } from "./use-load";

type GiftCard = components["schemas"]["GiftCardOut"];

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const giftStatus = (g: Pick<GiftCard, "status" | "balance">) =>
  g.status === "active"
    ? { label: "Active", tone: "green" as const }
    : { label: g.status.replace(/^\w/, (c) => c.toUpperCase()), tone: "neutral" as const };

function Card({ g, onUse }: { g: GiftCard; onUse: (g: GiftCard) => void }) {
  const st = giftStatus(g);
  const used = g.initial_amount > 0 ? 1 - g.balance / g.initial_amount : 1;
  return (
    <li className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2">
          <GiftIcon aria-hidden className="size-5 text-drs-green" />
          <span className="font-mono text-sm font-semibold tracking-wider text-drs-ink">{g.code}</span>
        </span>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
      <p className="mt-3 text-2xl font-semibold text-drs-ink tabular-nums">
        {rupees(g.balance)}{" "}
        <span className="text-sm font-normal text-drs-ink/70">left of {rupees(g.initial_amount)}</span>
      </p>
      <div
        role="meter"
        aria-label={`${g.code} balance`}
        aria-valuemin={0}
        aria-valuemax={g.initial_amount}
        aria-valuenow={g.balance}
        className="mt-2 h-2 overflow-hidden rounded-full bg-drs-ink/10"
      >
        <span
          className="block h-full rounded-full bg-drs-green"
          style={{ width: `${Math.max(0, 1 - used) * 100}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-drs-ink/75">
        <span>{g.expires_at ? `Valid till ${dateFmt.format(new Date(g.expires_at))}` : "No expiry"}</span>
        {g.status === "active" && g.balance > 0 && (
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            onClick={() => onUse(g)}
            aria-label={`Add to wallet: ${g.code}`}
          >
            Add to wallet
          </Button>
        )}
      </div>
    </li>
  );
}

/** Your gift cards, a balance check for any code, and redeeming value into the wallet. */
export function GiftCardsView() {
  const cards = useLoad(() => api.GET("/api/v1/loyalty/gift-cards"), "Couldn't load your gift cards.");
  const id = useId();
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState<GiftCard | null>(null);
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "busy" } | { kind: "error" | "done"; text: string }>({
    kind: "idle",
  });

  const use = (g: GiftCard) => {
    setCode(g.code);
    setChecked(g);
    setAmount(String(g.balance));
    setState({ kind: "idle" });
    document.getElementById(`${id}-code`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  async function check() {
    const c = code.trim().toUpperCase();
    if (c.length < 4) return setState({ kind: "error", text: "Enter the gift card code." });
    setState({ kind: "busy" });
    try {
      const { data, error } = await api.GET("/api/v1/loyalty/gift-cards/{code}/balance", {
        params: { path: { code: c } },
      });
      if (!data)
        return (
          setChecked(null),
          setState({ kind: "error", text: detailOf(error) ?? "Gift card not found." })
        );
      setChecked(data);
      setAmount(String(data.balance));
      setState({ kind: "idle" });
    } catch {
      setState({ kind: "error", text: "You seem to be offline." });
    }
  }

  // Moves money into the wallet: one Idempotency-Key per redeem attempt.
  const redeemAttempt = useAttemptKey();

  async function redeem() {
    if (!checked) return;
    const amt = Number(amount);
    if (!(amt > 0) || amt > checked.balance)
      return setState({ kind: "error", text: `Enter an amount up to ${rupees(checked.balance)}.` });
    setState({ kind: "busy" });
    try {
      const body = { code: checked.code, amount: amt };
      const { data, error } = await redeemAttempt.send(body, (headers) =>
        api.POST("/api/v1/loyalty/gift-cards/redeem", { body, headers }),
      );
      if (!data) return setState({ kind: "error", text: detailOf(error) ?? "Couldn't redeem this card." });
      setChecked(data);
      setAmount(data.balance > 0 ? String(data.balance) : "");
      setState({ kind: "done", text: `${rupees(amt)} added to your wallet.` });
      await cards.reload();
    } catch {
      setState({ kind: "error", text: "You seem to be offline." });
    }
  }

  return (
    <div className="space-y-4">
      <section
        aria-labelledby={`${id}-h`}
        className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
      >
        <h2 id={`${id}-h`} className="text-lg font-semibold text-drs-ink">
          Redeem a gift card
        </h2>
        <p className="mt-0.5 text-sm text-drs-ink/75">
          The value goes into your DRS wallet and pays for deliveries.
        </p>
        <form
          className="mt-4 flex max-w-xl flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void check();
          }}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor={`${id}-code`} className="text-sm font-medium text-drs-ink">
              Gift card code
            </label>
            <input
              id={`${id}-code`}
              value={code}
              maxLength={20}
              onChange={(e) => {
                setCode(e.target.value);
                setChecked(null);
              }}
              className="mt-1.5 h-11 w-full rounded-lg border border-drs-ink/20 bg-drs-white px-3 font-mono text-sm uppercase hover:border-drs-green/50 focus-visible:border-drs-green"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={state.kind === "busy"} className="rounded-full">
            Check balance
          </Button>
        </form>

        {checked && (
          <div className="mt-4 rounded-xl bg-drs-cream/60 p-4 text-sm" role="status">
            <p className="font-medium text-drs-ink">
              {checked.code}: {rupees(checked.balance)} available
              {checked.status !== "active" && ` · ${giftStatus(checked).label}`}
            </p>
            {checked.status === "active" && checked.balance > 0 && (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div>
                  <label htmlFor={`${id}-amt`} className="text-sm font-medium text-drs-ink">
                    Amount to add
                  </label>
                  <div className="relative mt-1.5 w-40">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-drs-ink/70"
                    >
                      ₹
                    </span>
                    <input
                      id={`${id}-amt`}
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      className="h-11 w-full rounded-lg border border-drs-ink/20 bg-drs-white pr-3 pl-7 text-sm hover:border-drs-green/50 focus-visible:border-drs-green"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={redeem}
                  disabled={state.kind === "busy"}
                  className="rounded-full"
                >
                  {state.kind === "busy" ? "Adding…" : "Add to wallet"}
                </Button>
              </div>
            )}
          </div>
        )}
        {state.kind === "error" && (
          <p role="alert" className="mt-3 text-sm text-drs-maroon">
            {state.text}
          </p>
        )}
        {state.kind === "done" && (
          <p role="status" className="mt-3 flex items-center gap-2 text-sm font-medium text-drs-green">
            <CheckCircle2Icon aria-hidden className="size-4" /> {state.text}{" "}
            <Link href="/account/wallet" className="underline">
              View wallet
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="mine-h">
        <h2 id="mine-h" className="mb-3 text-lg font-semibold text-drs-ink">
          Your gift cards
        </h2>
        {cards.error ? (
          <LoadError text={cards.error} />
        ) : !cards.data ? (
          <PanelSkeleton label="Loading gift cards" />
        ) : cards.data.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/70 px-6 py-10 text-center text-sm text-drs-ink/75">
            No gift cards yet. Got one? Enter its code above.
          </p>
        ) : (
          <ul aria-label="Your gift cards" className="grid gap-3 md:grid-cols-2">
            {cards.data.map((g) => (
              <Card key={g.code} g={g} onUse={use} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
