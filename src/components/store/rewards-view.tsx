"use client";

import { CheckCircle2Icon, CopyIcon, Share2Icon, SparklesIcon } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import { cn } from "@/lib/utils";
import { detailOf } from "./cart";
import { useAttemptKey } from "./use-attempt-key";
import { LoadError, PanelSkeleton, useLoad } from "./use-load";

const REASONS: Record<string, string> = {
  order: "Earned on an order",
  referral: "Referral reward",
  redeem: "Redeemed",
  adjust: "Adjustment",
  expire: "Expired",
  signup: "Welcome bonus",
};
export const reasonLabel = (r: string) =>
  REASONS[r] ?? r.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function ReferralCard() {
  const ref = useLoad(() => api.GET("/api/v1/loyalty/referral-code"), "Couldn't load your referral code.");
  const [copied, setCopied] = useState(false);
  if (ref.error) return <LoadError text={ref.error} />;
  if (!ref.data) return <PanelSkeleton rows={1} label="Loading referral code" />;
  const { code, reward_points } = ref.data;
  const message = `Get farm-fresh milk from DRS Dairy, delivered before 7 am. Use my code ${code} when you sign up.`;
  return (
    <section
      aria-labelledby="refer-h"
      className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
    >
      <h2 id="refer-h" className="text-lg font-semibold text-drs-ink">
        Refer a friend
      </h2>
      <p className="mt-0.5 text-sm text-drs-ink/75">
        You earn {reward_points} points when a friend uses your code and pays for their first order.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-xl border-2 border-dashed border-drs-gold bg-drs-cream/60 px-4 py-2 font-mono text-lg font-semibold tracking-[0.15em] text-drs-ink">
          {code}
        </span>
        <Button
          type="button"
          variant="secondary"
          className="rounded-full"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? (
            <CheckCircle2Icon aria-hidden className="size-4" />
          ) : (
            <CopyIcon aria-hidden className="size-4" />
          )}
          {copied ? "Copied" : "Copy code"}
        </Button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={() => navigator.share({ title: "DRS Dairy", text: message }).catch(() => undefined)}
          >
            <Share2Icon aria-hidden className="size-4" /> Share
          </Button>
        )}
      </div>
      <p role="status" className="sr-only">
        {copied ? "Referral code copied" : ""}
      </p>
    </section>
  );
}

function RedeemReferral() {
  const id = useId();
  // Awards points: one Idempotency-Key per redeem attempt.
  const attempt = useAttemptKey();
  const [code, setCode] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "busy" } | { kind: "done" | "error"; text: string }>({
    kind: "idle",
  });
  return (
    <section
      aria-labelledby={`${id}-h`}
      className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
    >
      <h2 id={`${id}-h`} className="text-lg font-semibold text-drs-ink">
        Got a friend&apos;s code?
      </h2>
      {state.kind === "done" ? (
        <p role="status" className="mt-3 flex items-start gap-2 text-sm font-medium text-drs-green">
          <CheckCircle2Icon aria-hidden className="mt-0.5 size-4 shrink-0" /> {state.text}
        </p>
      ) : (
        <form
          className="mt-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const c = code.trim().toUpperCase();
            if (c.length < 4) return setState({ kind: "error", text: "Enter the code your friend shared." });
            setState({ kind: "busy" });
            try {
              const body = { code: c };
              const { data, error } = await attempt.send(body, (headers) =>
                api.POST("/api/v1/loyalty/referral/redeem", { body, headers }),
              );
              setState(
                data
                  ? { kind: "done", text: data.detail }
                  : { kind: "error", text: detailOf(error) ?? "That code can't be used." },
              );
            } catch {
              setState({ kind: "error", text: "You seem to be offline." });
            }
          }}
        >
          <label htmlFor={id} className="text-sm font-medium text-drs-ink">
            Referral code
          </label>
          <div className="mt-1.5 flex max-w-md gap-2">
            <input
              id={id}
              value={code}
              maxLength={16}
              onChange={(e) => setCode(e.target.value)}
              aria-invalid={state.kind === "error" || undefined}
              aria-describedby={state.kind === "error" ? `${id}-err` : undefined}
              className="h-11 min-w-0 flex-1 rounded-lg border border-drs-ink/20 bg-drs-white px-3 text-sm uppercase hover:border-drs-green/50 focus-visible:border-drs-green aria-[invalid=true]:border-drs-maroon"
            />
            <Button type="submit" disabled={state.kind === "busy"} className="shrink-0 rounded-full">
              {state.kind === "busy" ? "Applying…" : "Apply"}
            </Button>
          </div>
          {state.kind === "error" && (
            <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-drs-maroon">
              {state.text}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

/** Loyalty points + history, your referral code, and redeeming a friend's code. */
export function RewardsView() {
  const loyalty = useLoad(() => api.GET("/api/v1/loyalty"), "Couldn't load your points.");
  return (
    <div className="space-y-4">
      {loyalty.error ? (
        <LoadError text={loyalty.error} />
      ) : !loyalty.data ? (
        <PanelSkeleton rows={1} label="Loading points" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div className="rounded-2xl bg-drs-green p-5 text-drs-cream shadow-sm md:p-6">
            <p className="flex items-center gap-2 text-sm text-drs-cream/85">
              <SparklesIcon aria-hidden className="size-4" /> Your points
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums" data-testid="points-balance">
              {loyalty.data.points_balance.toLocaleString("en-IN")}
            </p>
            <p className="mt-2 text-sm text-drs-cream/85">Earned on orders and referrals.</p>
          </div>
          <section
            aria-labelledby="ledger-h"
            className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
          >
            <h2 id="ledger-h" className="text-lg font-semibold text-drs-ink">
              Points history
            </h2>
            {loyalty.data.recent.length ? (
              <ul aria-label="Points history" className="mt-2 divide-y divide-drs-ink/10">
                {loyalty.data.recent.map((e, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="text-drs-ink">{reasonLabel(e.reason)}</span>
                    <span className="text-right">
                      <span
                        className={cn(
                          "block font-semibold tabular-nums",
                          e.delta >= 0 ? "text-drs-green" : "text-drs-ink",
                        )}
                      >
                        {e.delta >= 0 ? "+" : "−"}
                        {Math.abs(e.delta)} pts
                      </span>
                      <span className="block text-xs text-drs-ink/70 tabular-nums">
                        Balance {e.balance_after}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-drs-ink/75">
                No points yet — they arrive with your first order.
              </p>
            )}
          </section>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReferralCard />
        <RedeemReferral />
      </div>
    </div>
  );
}
