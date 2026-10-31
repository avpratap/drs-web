import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CalendarCheckIcon,
  PauseCircleIcon,
  SunriseIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCategories, getFeaturedProducts } from "@/modules/store/catalog";
import { categoryHref, categoryMeta } from "@/modules/store/categories";
import { ProductCard } from "./product-card";
import { buttonClass } from "@/components/ui/button";

export function SectionHeading({
  id,
  eyebrow,
  title,
  action,
}: {
  id: string;
  eyebrow: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-drs-ink/70 uppercase">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-2xl leading-tight font-semibold text-drs-green md:text-[2rem]">
          {title}
        </h2>
        <div aria-hidden className="mt-3 h-0.5 w-10 rounded bg-drs-gold" />
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-drs-green hover:underline"
        >
          {action.label}
          <ArrowRightIcon aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function Unavailable({ what }: { what: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/60 px-6 py-10 text-center text-sm text-drs-ink/75">
      We couldn&apos;t load {what} just now. Please refresh in a moment.
    </p>
  );
}

export const pulse = "animate-pulse rounded-2xl bg-drs-ink/[0.06] motion-reduce:animate-none";

export function CategoryGridSkeleton() {
  return (
    <ul aria-hidden className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className={cn(pulse, "h-40")} />
      ))}
    </ul>
  );
}

export async function CategoryGrid() {
  const res = await getCategories();
  if (!res.ok) return <Unavailable what="categories" />;
  if (!res.data.length) return <Unavailable what="categories" />;
  return (
    <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))] md:gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))] xl:grid-cols-[repeat(6,minmax(0,1fr))]">
      {res.data.map((slug) => {
        const m = categoryMeta(slug);
        const Icon = m.icon;
        return (
          <li key={m.slug}>
            <Link
              href={categoryHref(m.slug)}
              className="group flex h-full min-h-40 flex-col rounded-2xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0 md:p-5"
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-12 place-items-center rounded-full",
                  m.milkLine ? "bg-drs-sky/20 text-drs-green" : "bg-drs-green/10 text-drs-green",
                )}
              >
                <Icon className="size-6" strokeWidth={1.6} />
              </span>
              <span className="mt-4 text-base font-semibold text-drs-ink group-hover:text-drs-green">
                {m.label}
              </span>
              <span className="mt-1 text-xs leading-relaxed text-drs-ink/75">{m.blurb}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Placeholder product tiles for the shop grid while results stream in. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul aria-hidden className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl border border-drs-ink/5 bg-drs-white">
          <div className={cn(pulse, "aspect-[4/3] rounded-none")} />
          <div className="space-y-2 p-4">
            <div className={cn(pulse, "h-3 w-1/3")} />
            <div className={cn(pulse, "h-4 w-4/5")} />
            <div className={cn(pulse, "h-3 w-1/4")} />
            <div className={cn(pulse, "mt-4 h-5 w-1/2")} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProductStripSkeleton() {
  return (
    <ul aria-hidden className="flex gap-4 overflow-hidden md:grid md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="shrink-0 max-sm:w-[72%] sm:max-md:w-[45%]">
          <div className={cn(pulse, "aspect-[4/3]")} />
          <div className={cn(pulse, "mt-3 h-4 w-2/3")} />
          <div className={cn(pulse, "mt-2 h-4 w-1/3")} />
        </li>
      ))}
    </ul>
  );
}

export async function FeaturedProducts() {
  const res = await getFeaturedProducts(8);
  if (!res.ok) return <Unavailable what="our products" />;
  if (!res.data.length) return <Unavailable what="our products" />;
  return (
    <ul
      aria-label="Featured products"
      className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-4"
    >
      {res.data.slice(0, 8).map((p) => (
        <li key={p.id} className="shrink-0 snap-start max-sm:w-[72%] sm:max-md:w-[45%]">
          <ProductCard product={p} className="h-full" />
        </li>
      ))}
    </ul>
  );
}

const STEPS = [
  { icon: CalendarCheckIcon, title: "Pick your days", body: "Daily, alternate days or chosen weekdays." },
  {
    icon: SunriseIcon,
    title: "Wake up to fresh milk",
    body: "At your door before 7 am, chilled all the way.",
  },
  { icon: PauseCircleIcon, title: "Pause anytime", body: "Travelling? Skip a day or pause in one tap." },
];

export function SubscriptionBand() {
  return (
    <section
      aria-labelledby="subscribe-heading"
      className="on-dark overflow-hidden rounded-3xl bg-drs-green text-drs-cream"
    >
      <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_1.4fr] lg:items-center lg:gap-12 lg:p-14">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-drs-cream/80 uppercase">
            Daily subscription
          </p>
          <h2 id="subscribe-heading" className="mt-2 text-2xl leading-tight font-semibold md:text-[2rem]">
            Never run out of milk again.
          </h2>
          <div aria-hidden className="mt-3 h-0.5 w-10 rounded bg-drs-gold" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-drs-cream/85 md:text-base">
            Set it once and we deliver every morning. Pay from your DRS wallet and change your order up to the
            night before.
          </p>
          <Link href="/subscriptions" className={buttonClass("inverse", "mt-6 px-6 text-sm", "pill")}>
            Start a subscription
            <ArrowRightIcon aria-hidden className="size-4" />
          </Link>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-2xl border border-drs-cream/15 bg-drs-cream/[0.06] p-5">
              <span className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-10 place-items-center rounded-full border border-drs-gold/70"
                >
                  <Icon className="size-5" strokeWidth={1.6} />
                </span>
                <span className="text-xs font-semibold tracking-[0.18em] text-drs-cream/75 uppercase">
                  Step {i + 1}
                </span>
              </span>
              <p className="mt-4 font-semibold">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-drs-cream/80">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const PROMISES = [
  { icon: SunriseIcon, title: "Before 7 am", body: "Fresh at your door every morning" },
  { icon: BadgeCheckIcon, title: "Lab-tested", body: "Every batch checked for purity" },
  { icon: CalendarCheckIcon, title: "Flexible plans", body: "Subscribe, pause or order once" },
  { icon: PauseCircleIcon, title: "No lock-in", body: "Skip or cancel any time" },
];

export function Promises() {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {PROMISES.map(({ icon: Icon, title, body }) => (
        <li
          key={title}
          className="flex flex-col gap-3 rounded-2xl bg-drs-white/70 p-4 ring-1 ring-drs-ink/[0.06] md:flex-row md:items-start md:p-5"
        >
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-full bg-drs-green/10 text-drs-green"
          >
            <Icon className="size-5" strokeWidth={1.6} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-drs-ink">{title}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-drs-ink/75">{body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
