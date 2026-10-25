import { BadgeCheckIcon, StarIcon } from "lucide-react";
import { pulse, Unavailable } from "@/components/store/sections";
import { cn } from "@/lib/utils";
import { getProductRatings } from "@/modules/store/catalog";

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={cn("size-4", i <= Math.round(value) ? "fill-drs-gold text-drs-gold" : "text-drs-ink/25")}
        />
      ))}
    </span>
  );
}

export function ReviewsSkeleton() {
  return (
    <div aria-hidden className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <div className={cn(pulse, "h-48")} />
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={cn(pulse, "h-28")} />
        ))}
      </div>
    </div>
  );
}

/** Approved reviews: average + star distribution, then the most recent reviews. */
export async function Reviews({ productId }: { productId: number }) {
  const res = await getProductRatings(productId);
  if (!res.ok) return <Unavailable what="reviews" />;
  const { count, average, distribution, ratings } = res.data;
  if (count === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/60 px-6 py-8 text-center text-sm text-drs-ink/75">
        No reviews yet. Customers can review a product after it&apos;s delivered.
      </p>
    );
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr] lg:gap-12">
      <div className="self-start rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm">
        <p className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold text-drs-green">{average.toFixed(1)}</span>
          <span className="text-sm text-drs-ink/75">out of 5</span>
        </p>
        <Stars value={average} className="mt-1" />
        <p className="mt-1 text-sm text-drs-ink/75">
          {count} review{count === 1 ? "" : "s"}
        </p>
        <dl className="mt-4 space-y-1.5">
          {[5, 4, 3, 2, 1].map((s) => {
            const n = distribution[String(s)] ?? 0;
            return (
              <div key={s} className="flex items-center gap-2 text-xs text-drs-ink/80">
                <dt className="w-10 shrink-0">{s} star</dt>
                <dd className="flex flex-1 items-center gap-2">
                  <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-drs-ink/10">
                    <span
                      className="block h-full rounded-full bg-drs-green"
                      style={{ width: `${count ? (n / count) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="w-6 text-right tabular-nums">{n}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      <ul aria-label="Customer reviews" className="space-y-4">
        {ratings.map((r) => (
          <li key={r.id} className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars value={r.stars} />
              <span className="sr-only">{r.stars} out of 5 stars</span>
              {r.verified_purchase && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-drs-green">
                  <BadgeCheckIcon aria-hidden className="size-3.5" />
                  Verified purchase
                </span>
              )}
            </div>
            {r.comment && (
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-drs-ink/90">{r.comment}</p>
            )}
            {r.admin_reply && (
              <p className="mt-3 rounded-lg bg-drs-cream px-3 py-2 text-sm text-drs-ink/85">
                <span className="font-semibold text-drs-green">DRS Dairy: </span>
                {r.admin_reply}
              </p>
            )}
            {r.helpful_count > 0 && (
              <p className="mt-2 text-xs text-drs-ink/70">
                {r.helpful_count} {r.helpful_count === 1 ? "person" : "people"} found this helpful
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
