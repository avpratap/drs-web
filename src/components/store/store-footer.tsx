import { BadgeCheckIcon, LeafIcon, ShieldCheckIcon, TruckIcon } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { StoreLogo } from "./logo";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/products?category=milk", label: "Milk" },
      { href: "/products?category=buttermilk", label: "Buttermilk" },
      { href: "/products?category=paneer", label: "Paneer" },
      { href: "/products?category=ghee", label: "Ghee" },
      { href: "/products", label: "All products" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About DRS" },
      { href: "/journal", label: "Journal" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/faq", label: "FAQs" },
      { href: "/delivery-areas", label: "Delivery areas" },
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

const TRUST = [
  { icon: ShieldCheckIcon, label: "FSSAI licensed" },
  { icon: BadgeCheckIcon, label: "Every batch lab-tested" },
  { icon: TruckIcon, label: "Cold-chain delivery" },
  { icon: LeafIcon, label: "No preservatives" },
];

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function StoreFooter() {
  const fssai = process.env.NEXT_PUBLIC_FSSAI_LICENSE;
  return (
    <footer className="on-dark mt-20 bg-drs-green text-drs-cream">
      <div className="border-b border-drs-cream/10">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-8 md:grid-cols-4 md:px-6">
          {TRUST.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm font-medium">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-drs-gold/70">
                <Icon aria-hidden className="size-5 text-drs-cream" strokeWidth={1.75} />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-6">
        <div className="col-span-2 md:col-span-1">
          <StoreLogo onDark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-drs-cream/80">
            Milk, curd, paneer and ghee from DRS, pasteurised at dawn and at your door before breakfast.
          </p>
          <p className="mt-4 text-xs text-drs-cream/75">
            {fssai ? `FSSAI Lic. No. ${fssai}` : "FSSAI licensed dairy"}
          </p>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-xs font-semibold tracking-[0.18em] text-drs-cream/75 uppercase">{c.title}</h2>
            <ul className="mt-3 flex flex-col">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-11 items-center text-sm text-drs-cream/90 hover:text-drs-cream hover:underline md:min-h-9"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-drs-cream/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-drs-cream/75 md:px-6">
          © {await currentYear()} DRS Dairy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
