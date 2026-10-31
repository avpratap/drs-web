import {
  ArrowRightIcon,
  CalendarCheckIcon,
  PauseCircleIcon,
  RepeatIcon,
  SunriseIcon,
  WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/store/product-card";
import { ProductStripSkeleton, SectionHeading, Unavailable } from "@/components/store/sections";
import { isCustomerToken, isSubscriberToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import { getSubscribableProducts } from "@/modules/store/catalog";

export const metadata: Metadata = {
  title: "Daily milk subscription",
  description:
    "Fresh DRS milk, curd and more at your door before 7 am, every day you choose. Skip or change any day until the evening before, and pause whenever you travel.",
  alternates: { canonical: "/subscriptions" },
  openGraph: { title: "Daily milk subscription · DRS Dairy", type: "website" },
};

const STEPS = [
  {
    icon: CalendarCheckIcon,
    title: "Choose products and days",
    body: "Every day, every few days or chosen weekdays — set the quantity for each.",
  },
  {
    icon: SunriseIcon,
    title: "Wake up to it",
    body: "Delivered before 7 am, pasteurised at dawn and chilled all the way.",
  },
  {
    icon: WalletIcon,
    title: "Pay as you go",
    body: "Each morning's delivery is paid from your DRS wallet. No lock-in.",
  },
  {
    icon: PauseCircleIcon,
    title: "Skip, change or pause",
    body: "Change any day until the evening cutoff, or pause while you travel.",
  },
];

const FAQ = [
  {
    q: "When do I need to make changes?",
    a: "Changes for tomorrow close at the evening cutoff; any later day can be changed whenever you like.",
  },
  {
    q: "How am I charged?",
    a: "Only for what's delivered, from your DRS wallet. Top it up any time from your account.",
  },
  {
    q: "Can I stop?",
    a: "Yes. Pause and resume whenever you want, or cancel — there's no minimum term.",
  },
];

const primary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-drs-green px-7 text-[0.9375rem] font-semibold text-drs-cream shadow-sm transition-colors hover:bg-drs-green/90";
const secondary =
  "inline-flex min-h-12 items-center justify-center rounded-full border border-drs-green/30 bg-drs-white px-7 text-[0.9375rem] font-semibold text-drs-green transition-colors hover:border-drs-green";

/**
 * Who's looking decides the next step: subscribers manage their standing orders; everyone
 * else picks from the subscribable products below. Read inside Suspense (the cookie makes it
 * per-request), so the rest of the page stays static.
 */
async function HeroActions() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (isSubscriberToken(token))
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/account/subscriptions" prefetch={false} className={primary}>
          Manage your subscriptions
          <ArrowRightIcon aria-hidden className="size-4" />
        </Link>
        <Link href="#subscribable" className={secondary}>
          Add products
        </Link>
      </div>
    );
  return <PublicActions signedIn={isCustomerToken(token)} />;
}

function PublicActions({ signedIn }: { signedIn?: boolean }) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link href="#subscribable" className={primary}>
        Choose your products
        <ArrowRightIcon aria-hidden className="size-4" />
      </Link>
      {!signedIn && (
        <Link href="/account/login?next=%2Fsubscriptions" prefetch={false} className={secondary}>
          Sign in
        </Link>
      )}
    </div>
  );
}

async function SubscribableProducts() {
  const res = await getSubscribableProducts();
  if (!res.ok) return <Unavailable what="our products" />;
  if (!res.data.length) return <Unavailable what="subscription products" />;
  return (
    <ul
      aria-label="Products available on subscription"
      className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))] md:gap-5 lg:grid-cols-[repeat(4,minmax(0,1fr))]"
    >
      {res.data.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} className="h-full" />
        </li>
      ))}
    </ul>
  );
}

/** Public landing page for the daily subscription (linked from the hero, nav and home band). */
export default function SubscriptionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24">
      <section aria-labelledby="sub-hero" className="max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-drs-ink/70 uppercase">
          <RepeatIcon aria-hidden className="size-4 text-drs-green" /> Daily subscription
        </p>
        <h1
          id="sub-hero"
          className="mt-3 text-[2rem] leading-[1.1] font-semibold tracking-tight text-drs-green md:text-5xl"
        >
          Fresh milk every morning, without reordering.
        </h1>
        <div aria-hidden className="mt-4 h-0.5 w-10 rounded bg-drs-gold" />
        <p className="mt-5 max-w-xl text-base leading-relaxed text-drs-ink/80 md:text-lg">
          Set it once and DRS delivers before 7&nbsp;am on the days you choose. Skip a day, change a quantity
          or pause for a holiday — right up to the evening before.
        </p>
        <Suspense fallback={<PublicActions />}>
          <HeroActions />
        </Suspense>
      </section>

      <section aria-labelledby="how-heading" className="mt-14 md:mt-20">
        <SectionHeading id="how-heading" eyebrow="How it works" title="Four steps, then it runs itself" />
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(4,minmax(0,1fr))]">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm">
              <span className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-drs-gold/70 text-drs-green"
                >
                  <Icon className="size-5" strokeWidth={1.6} />
                </span>
                <span className="text-xs font-semibold tracking-[0.16em] text-drs-ink/70 uppercase">
                  Step {i + 1}
                </span>
              </span>
              <h3 className="mt-3 font-semibold text-drs-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-drs-ink/75">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="subscribable-heading"
        id="subscribable"
        className="mt-14 scroll-mt-32 md:mt-20"
      >
        <SectionHeading
          id="subscribable-heading"
          eyebrow="Available on subscription"
          title="Pick what comes every morning"
          action={{ href: "/products", label: "Shop everything" }}
        />
        <Suspense fallback={<ProductStripSkeleton />}>
          <SubscribableProducts />
        </Suspense>
      </section>

      <section
        aria-labelledby="sub-faq"
        className="on-dark mt-14 rounded-3xl bg-drs-green p-6 text-drs-cream md:mt-20 md:p-10"
      >
        <h2 id="sub-faq" className="text-2xl font-semibold md:text-[2rem]">
          Good to know
        </h2>
        <div aria-hidden className="mt-3 h-0.5 w-10 rounded bg-drs-gold" />
        <dl className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[repeat(3,minmax(0,1fr))]">
          {FAQ.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-drs-cream/85">{a}</dd>
            </div>
          ))}
        </dl>
        <Link
          href="/faq"
          className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-drs-cream underline-offset-4 hover:underline"
        >
          More questions <ArrowRightIcon aria-hidden className="size-4" />
        </Link>
      </section>
    </div>
  );
}
