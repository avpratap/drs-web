import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";

const TILES = [
  { href: "/products", title: "Products", body: "SKUs, units, GST & HSN, and pack variants." },
  { href: "/price-tiers", title: "Price tiers", body: "Retail and B2B tiers that prices hang off." },
  { href: "/product-prices", title: "Product prices", body: "Tiered unit prices with validity windows." },
];

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="Manage the DRS catalogue and pricing." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="group rounded-xl">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <h2 className="text-lg font-semibold text-drs-green">{t.title}</h2>
              <p className="mt-2 text-sm text-drs-ink/75">{t.body}</p>
              <span className="mt-4 inline-block text-sm font-medium text-drs-green">
                Open <span aria-hidden>→</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
