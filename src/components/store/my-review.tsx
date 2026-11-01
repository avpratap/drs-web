"use client";

import { BadgeCheckIcon, PencilIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api/browser";
import { cn } from "@/lib/utils";
import {
  MAX_COMMENT,
  myReviewBadge,
  reviewPayload,
  savedMessage,
  starLabel,
  validateReview,
  type Review,
} from "@/modules/store/reviews";
import { detailOf, useCart } from "./cart";

const card = "rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6";

function loginHref(): string {
  return `/account/login?next=${encodeURIComponent(window.location.pathname)}`;
}

/** 1–5 stars as a radio group: arrow keys move, Space/Enter picks, each star is labelled. */
function StarPicker({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: number;
  onChange: (n: number) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const name = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div
      role="radiogroup"
      aria-label="Your rating"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className="flex gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <label
          key={n}
          className="focus-ring-within relative grid size-11 cursor-pointer place-items-center rounded-full"
          onMouseEnter={() => setHover(n)}
        >
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-full opacity-0"
            aria-label={starLabel(n)}
          />
          <StarIcon
            aria-hidden
            className={cn(
              "size-7 transition-transform peer-focus-visible:scale-110",
              n <= shown ? "fill-drs-gold text-drs-gold" : "text-drs-ink/35",
            )}
            strokeWidth={1.5}
          />
        </label>
      ))}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={cn("size-4", i <= value ? "fill-drs-gold text-drs-gold" : "text-drs-ink/25")}
        />
      ))}
    </span>
  );
}

function ReviewForm({
  productId,
  productName,
  existing,
  onSaved,
  onCancel,
}: {
  productId: number;
  productName: string;
  existing: Review | null;
  onSaved: (r: Review) => void;
  onCancel?: () => void;
}) {
  const [stars, setStars] = useState(existing?.stars ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = useId();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validateReview(stars, comment);
    if (invalid) return setError(invalid);
    setBusy(true);
    setError(null);
    try {
      const {
        data,
        error: err,
        response,
      } = await api.POST("/api/v1/products/{product_id}/ratings", {
        params: { path: { product_id: productId } },
        body: reviewPayload(stars, comment),
      });
      if (data) return onSaved(data);
      if (response.status === 401) return window.location.assign(loginHref());
      setError(detailOf(err) ?? "Couldn't save your review. Please try again.");
    } catch {
      setError("You seem to be offline. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate aria-label={`Review ${productName}`} className={card}>
      <p id={`${ids}-l`} className="text-sm font-semibold text-drs-ink">
        Your rating
      </p>
      <div className="mt-1">
        <StarPicker
          value={stars}
          onChange={(n) => {
            setStars(n);
            setError(null);
          }}
          invalid={!!error && stars === 0}
          describedBy={error ? `${ids}-err` : undefined}
        />
      </div>
      <label htmlFor={`${ids}-c`} className="mt-4 block text-sm font-semibold text-drs-ink">
        Your review <span className="font-normal text-drs-ink/70">(optional)</span>
      </label>
      <textarea
        id={`${ids}-c`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={MAX_COMMENT}
        rows={4}
        placeholder="Freshness, taste, packaging, delivery…"
        aria-describedby={`${ids}-hint`}
        className="mt-1.5 block w-full rounded-lg border border-drs-ink/20 bg-drs-white px-3 py-2.5 text-[0.9375rem] text-drs-ink placeholder:text-drs-ink/70 focus:border-drs-green focus:outline-2 focus:outline-offset-1 focus:outline-drs-green"
      />
      <p id={`${ids}-hint`} className="mt-1.5 flex justify-between gap-3 text-xs text-drs-ink/75">
        <span>
          Reviews are public but anonymous — please leave out phone numbers and addresses. Reviews from
          customers who haven&apos;t bought this product are checked before they appear.
        </span>
        <span className="shrink-0 tabular-nums">
          {comment.length}/{MAX_COMMENT}
        </span>
      </p>
      {error && (
        <p id={`${ids}-err`} role="alert" className="mt-3 text-sm font-medium text-drs-maroon">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" size="pill" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="pill" loading={busy}>
          {busy ? "Saving…" : existing ? "Update review" : "Post review"}
        </Button>
      </div>
    </form>
  );
}

function MyReviewCard({
  review,
  onEdit,
  onDelete,
  deleting,
}: {
  review: Review;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  deleting: boolean;
}) {
  const badge = myReviewBadge(review);
  return (
    <section aria-label="Your review" className={card}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p className="text-sm font-semibold text-drs-ink">Your review</p>
        <Stars value={review.stars} />
        <span className="sr-only">{review.stars} out of 5 stars</span>
        {review.verified_purchase && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-drs-green">
            <BadgeCheckIcon aria-hidden className="size-3.5" /> Verified purchase
          </span>
        )}
        {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
      </div>
      {review.comment && (
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-drs-ink/90">{review.comment}</p>
      )}
      {review.status === "pending" && (
        <p className="mt-2 text-xs text-drs-ink/75">Only you can see it until our team approves it.</p>
      )}
      {review.admin_reply && (
        <p className="mt-3 rounded-lg bg-drs-cream px-3 py-2 text-sm text-drs-ink/85">
          <span className="font-semibold text-drs-green">DRS Dairy: </span>
          {review.admin_reply}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="pill" onClick={onEdit}>
          <PencilIcon aria-hidden className="size-4" /> Edit review
        </Button>
        <ConfirmDialog
          danger
          title="Delete your review?"
          description="Your rating and comment will be removed."
          confirmLabel="Delete review"
          pending={deleting}
          onConfirm={onDelete}
          trigger={
            <Button type="button" variant="ghost" size="pill" className="text-drs-maroon" disabled={deleting}>
              <Trash2Icon aria-hidden className="size-4" /> Delete
            </Button>
          }
        />
      </div>
    </section>
  );
}

type Mine = { state: "loading" } | { state: "error" } | { state: "ready"; review: Review | null };

/**
 * The customer's own rating for this product: a "Rate & review" form, or their review with
 * edit/delete. Signed-out visitors get a sign-in prompt. Anyone signed in may review (like the
 * app); a review from someone who hasn't bought the product is held for approval.
 */
export function MyReview({ productId, productName }: { productId: number; productName: string }) {
  const { session } = useCart();
  const [mine, setMine] = useState<Mine>({ state: "loading" });
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNoticeState] = useState<{ text: string; ok: boolean }>({ text: "", ok: true });
  const setNotice = (text: string, ok = true) => setNoticeState({ text, ok });

  const fetchMine = useCallback(async (): Promise<Mine> => {
    try {
      // Authenticated, the list includes the caller's own review (any status) flagged `mine`.
      const { data } = await api.GET("/api/v1/products/{product_id}/ratings", {
        params: { path: { product_id: productId }, query: { limit: 100 } },
      });
      return data ? { state: "ready", review: data.ratings.find((r) => r.mine) ?? null } : { state: "error" };
    } catch {
      return { state: "error" };
    }
  }, [productId]);

  useEffect(() => {
    if (session !== "customer") return;
    let live = true;
    void fetchMine().then((m) => live && setMine(m));
    return () => {
      live = false;
    };
  }, [session, fetchMine]);

  // The public list (server-rendered, cached) may also carry this review; show it once.
  const hideId = mine.state === "ready" && mine.review ? mine.review.id : null;
  const dedupe = hideId !== null && <style>{`#review-${hideId}{display:none}`}</style>;
  // One live region for every outcome (saved, deleted, failures), visible when set.
  const status = (
    <p
      role="status"
      className={
        notice.text
          ? cn(
              "rounded-xl px-4 py-3 text-sm font-medium",
              notice.ok ? "bg-drs-green/10 text-drs-green" : "bg-drs-maroon/10 text-drs-maroon",
            )
          : "sr-only"
      }
    >
      {notice.text}
    </p>
  );

  if (session === "unknown") return <div aria-hidden className="h-24" />;
  if (session === "signed-out")
    return (
      <div className={cn(card, "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}>
        <div>
          <p className="font-semibold text-drs-ink">Bought this? Rate &amp; review it</p>
          <p className="mt-0.5 text-sm text-drs-ink/75">
            Sign in to share what you think with other customers.
          </p>
        </div>
        {/* Only rendered client-side (the session is "unknown" on the server). */}
        <a href={loginHref()} className={buttonClass("secondary", "shrink-0", "pill")}>
          Sign in to review
        </a>
      </div>
    );
  if (mine.state === "loading")
    return <div aria-hidden className="h-24 animate-pulse rounded-2xl bg-drs-ink/[0.06]" />;
  if (mine.state === "error")
    return (
      <div className={card}>
        <p role="alert" className="text-sm text-drs-maroon">
          Couldn&apos;t load your review.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="pill"
          className="mt-3"
          onClick={() => {
            setMine({ state: "loading" });
            void fetchMine().then(setMine);
          }}
        >
          Try again
        </Button>
      </div>
    );

  const saved = (r: Review) => {
    setMine({ state: "ready", review: r });
    setEditing(false);
    setNotice(savedMessage(r));
  };

  if (!mine.review || editing)
    return (
      <div className="space-y-3">
        {dedupe}
        {status}
        {!mine.review && !editing ? (
          <div className={cn(card, "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}>
            <div>
              <p className="font-semibold text-drs-ink">Rate &amp; review</p>
              <p className="mt-0.5 text-sm text-drs-ink/75">
                Tell other customers what you think of {productName}.
              </p>
            </div>
            <Button
              type="button"
              size="pill"
              className="shrink-0"
              onClick={() => {
                setNotice("");
                setEditing(true);
              }}
            >
              <StarIcon aria-hidden className="size-4" /> Rate &amp; review
            </Button>
          </div>
        ) : (
          <ReviewForm
            productId={productId}
            productName={productName}
            existing={mine.review}
            onSaved={saved}
            onCancel={() => setEditing(false)}
          />
        )}
      </div>
    );

  return (
    <div className="space-y-3">
      {dedupe}
      {status}
      <MyReviewCard
        review={mine.review}
        deleting={deleting}
        onEdit={() => {
          setNotice("");
          setEditing(true);
        }}
        onDelete={async () => {
          setDeleting(true);
          try {
            const { response } = await api.DELETE("/api/v1/products/{product_id}/ratings", {
              params: { path: { product_id: productId } },
            });
            if (response.ok || response.status === 404) {
              setMine({ state: "ready", review: null });
              setNotice("Review deleted.");
            } else setNotice("Couldn't delete your review. Please try again.", false);
          } catch {
            setNotice("You seem to be offline. Please try again.", false);
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
