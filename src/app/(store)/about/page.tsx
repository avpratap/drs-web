import {
  ArrowRightIcon,
  BadgeCheckIcon,
  FlaskConicalIcon,
  HandHeartIcon,
  LeafIcon,
  MilkIcon,
  ShieldCheckIcon,
  SnowflakeIcon,
  SunriseIcon,
  TruckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, organizationLd } from "@/components/marketing/json-ld";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "DRS Dairy is named after our founder's late grandfather, Dhanna Ram Sherawat. Pure milk, honestly made and at your door before 7 am.",
  alternates: { canonical: "/about" },
  openGraph: { title: "The DRS story", type: "website" },
};

const FSSAI = process.env.NEXT_PUBLIC_FSSAI_LICENSE;

const VALUES = [
  {
    icon: LeafIcon,
    title: "Pure, nothing added",
    body: "No preservatives, no thickeners, no shortcuts. Just milk, the way it should be.",
  },
  {
    icon: HandHeartIcon,
    title: "Honest by habit",
    body: "Clear prices, honest labels and real answers when something isn't right.",
  },
  {
    icon: SunriseIcon,
    title: "Fresh every morning",
    body: "Milked, chilled and at your door before 7 am — not days later from a shelf.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Care at every step",
    body: "From the animals' feed to the seal on your bottle, we look after the details.",
  },
];

const JOURNEY = [
  {
    icon: MilkIcon,
    title: "Milked at dawn",
    body: "Fresh milk is collected from our partner farms early every morning.",
  },
  {
    icon: FlaskConicalIcon,
    title: "Tested, every batch",
    body: "Each batch is checked for quality and purity before it's packed.",
  },
  {
    icon: SnowflakeIcon,
    title: "Chilled all the way",
    body: "It stays cold from the dairy to your door, so it tastes just-milked.",
  },
  {
    icon: TruckIcon,
    title: "At your door by 7 am",
    body: "Our delivery partners bring it to you before your morning chai.",
  },
];

/** /about: the DRS heritage story, values, purity and farm-to-door (editorial, no CMS). */
export default function AboutPage() {
  return (
    <>
      <JsonLd data={organizationLd()} />

      {/* Heritage hero */}
      <section aria-labelledby="about-h" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-14 md:px-6 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-20 lg:pb-24">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-drs-ink/70 uppercase">Our story</p>
            <h1
              id="about-h"
              className="mt-3 max-w-xl text-[2.25rem] leading-[1.1] font-semibold tracking-tight text-drs-green md:text-5xl lg:text-[3.5rem]"
            >
              A name we carry with pride.
            </h1>
            <div aria-hidden className="mt-5 h-0.5 w-14 rounded bg-drs-gold" />
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-drs-ink/85">
              DRS is named after our founder&apos;s late grandfather,{" "}
              <strong className="font-semibold text-drs-ink">Dhanna Ram Sherawat</strong>. His initials are on
              every bottle we send out — a promise that what reaches your family is as honest as the people
              who raised us.
            </p>
          </div>
          {/* Monogram */}
          <div aria-hidden className="mx-auto w-full max-w-sm lg:max-w-md">
            <div className="relative aspect-square rounded-[2.5rem] bg-drs-green p-10 shadow-xl shadow-drs-green/20">
              <div className="absolute inset-6 rounded-[2rem] border border-drs-gold/50" />
              <div className="grid h-full place-items-center text-center text-drs-cream">
                <div>
                  <p className="text-7xl font-semibold tracking-[0.12em] md:text-8xl">DRS</p>
                  <div className="mx-auto mt-4 h-px w-24 bg-drs-gold" />
                  <p className="mt-4 text-sm tracking-[0.3em] text-drs-cream/85 uppercase">
                    Dhanna Ram Sherawat
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The story */}
      <section aria-labelledby="name-h" className="bg-drs-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <h2 id="name-h" className="text-2xl leading-tight font-semibold text-drs-green md:text-[2rem]">
            Why his name is on the bottle
          </h2>
          <div className="space-y-5 text-[1.0625rem] leading-[1.8] text-drs-ink/85">
            <p>
              Milk is the first food most of us grew up with. It was poured into steel tumblers every morning,
              boiled for chai and set into curd overnight. For our family it was never just a product — it was
              part of how a household looked after itself.
            </p>
            <p>
              When we started DRS Dairy, we wanted that same feeling in every delivery: milk you don&apos;t
              have to think twice about. Naming the dairy after Dhanna Ram Sherawat keeps us honest. Every
              bottle, every batch and every morning delivery has to be worthy of the name.
            </p>
            <blockquote className="border-l-4 border-drs-gold pl-5 text-xl leading-relaxed text-drs-green italic">
              Good milk isn&apos;t complicated. It just has to be pure, fresh and on time — every single day.
            </blockquote>
          </div>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values-h" className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <p className="text-xs font-semibold tracking-[0.2em] text-drs-ink/70 uppercase">What we stand for</p>
        <h2 id="values-h" className="mt-2 text-2xl font-semibold text-drs-green md:text-[2rem]">
          Our values
        </h2>
        <div aria-hidden className="mt-3 h-0.5 w-10 rounded bg-drs-gold" />
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-2xl border border-drs-ink/10 bg-drs-white p-6 shadow-sm">
              <span aria-hidden className="grid size-12 place-items-center rounded-full bg-drs-green/10">
                <Icon className="size-6 text-drs-green" strokeWidth={1.6} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-drs-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-drs-ink/75">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Purity & FSSAI */}
      <section aria-labelledby="purity-h" className="on-dark bg-drs-green text-drs-cream">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-drs-cream/80 uppercase">
              Purity you can check
            </p>
            <h2 id="purity-h" className="mt-2 text-2xl leading-tight font-semibold md:text-[2rem]">
              Licensed, tested and traceable
            </h2>
            <div aria-hidden className="mt-3 h-0.5 w-10 rounded bg-drs-gold" />
            <p className="mt-5 max-w-lg leading-relaxed text-drs-cream/90">
              DRS Dairy is licensed by the Food Safety and Standards Authority of India (FSSAI). Every batch
              is tested before it leaves the dairy, and nothing is added to our milk — ever.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: BadgeCheckIcon, k: "FSSAI licence", v: FSSAI ? `No. ${FSSAI}` : "Licensed dairy" },
              { icon: FlaskConicalIcon, k: "Quality checks", v: "Every batch, every day" },
              { icon: LeafIcon, k: "Preservatives", v: "None. Ever." },
              { icon: SnowflakeIcon, k: "Cold chain", v: "Dairy to doorstep" },
            ].map(({ icon: Icon, k, v }) => (
              <div key={k} className="rounded-2xl border border-drs-cream/15 bg-drs-cream/5 p-5">
                <dt className="flex items-center gap-2 text-sm text-drs-cream/80">
                  <Icon aria-hidden className="size-4 text-drs-gold" /> {k}
                </dt>
                <dd className="mt-1 text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Farm to door */}
      <section aria-labelledby="journey-h" className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <p className="text-xs font-semibold tracking-[0.2em] text-drs-ink/70 uppercase">Farm to door</p>
        <h2 id="journey-h" className="mt-2 text-2xl font-semibold text-drs-green md:text-[2rem]">
          From the farm to your door, before 7 am
        </h2>
        <div aria-hidden className="mt-3 h-0.5 w-10 rounded bg-drs-gold" />
        <ol className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-4">
          {JOURNEY.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative flex gap-4 md:flex-col md:gap-3">
              <span className="flex flex-col items-center md:flex-row">
                <span
                  aria-hidden
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-drs-green text-drs-cream"
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                {i < JOURNEY.length - 1 && (
                  <span
                    aria-hidden
                    className="mt-2 w-px flex-1 bg-drs-green/20 md:mt-0 md:ml-3 md:h-px md:w-auto"
                  />
                )}
              </span>
              <span className="pb-2">
                <span className="text-xs font-semibold tracking-wide text-drs-ink/75">Step {i + 1}</span>
                <span className="mt-0.5 block text-lg font-semibold text-drs-ink">{title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-drs-ink/75">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-h" className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <div className="flex flex-col items-start gap-5 rounded-3xl border border-drs-ink/10 bg-drs-white p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 id="cta-h" className="text-2xl font-semibold text-drs-green">
              Taste the difference tomorrow morning
            </h2>
            <p className="mt-1 text-drs-ink/75">Order today, or subscribe and never run out.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className={buttonClass("primary", "min-h-12 rounded-full px-6")}>
              Shop fresh <ArrowRightIcon aria-hidden className="size-4" />
            </Link>
            <Link href="/journal" className={buttonClass("secondary", "min-h-12 rounded-full px-6")}>
              Read the journal
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
