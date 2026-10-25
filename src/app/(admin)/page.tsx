import Link from "next/link";
import { PageHeader } from "@/components/ui/card";
import { NAV_GROUPS } from "@/components/layout/nav";
import { OverviewDashboard } from "@/components/overview/dashboard";

const BLURBS: Record<string, string> = {
  "/products": "SKUs, units, GST & HSN, pack variants.",
  "/price-tiers": "Retail and B2B tiers.",
  "/product-prices": "Tiered prices with validity windows.",
  "/accounts": "Wallets, credit, top-ups, settlements.",
  "/withdrawals": "Approve or reject wallet payouts.",
  "/payments": "Gateway payments and refunds.",
  "/refunds": "Refund status and reconciliation.",
  "/stock": "On-hand, low stock, reorder suggestions.",
  "/batches": "Lots by expiry (FEFO), receipts, write-offs.",
  "/locations": "Plants, hubs, cold storage, vehicles.",
  "/transfers": "Move stock between locations.",
  "/suppliers": "Vendors for purchase orders.",
  "/purchase-orders": "Order, place and receive (GRN).",
  "/boms": "Recipes for production.",
  "/production-orders": "Plan, start and complete production.",
  "/delivery": "Today's stops, cash collected, proof of delivery.",
  "/orders": "One-off orders; cancel and refund.",
  "/reports": "Revenue, orders, top products.",
  "/audit-log": "Every admin write.",
  "/banners": "Home-screen carousel.",
  "/articles": "Blog posts and guides.",
  "/pages": "About, FAQs, policies.",
  "/newsletter": "Subscribers.",
  "/tickets": "Customer support conversations.",
  "/ratings": "Moderate product reviews.",
  "/coupons": "Checkout discount codes.",
  "/feature-flags": "Switch features on and off.",
  "/cutoff": "Nightly order cutoff: status, history, manual run.",
  "/returns": "Approve, reject and refund customer returns.",
  "/subscriptions": "Standing orders: lines, pause, resume, cancel.",
  "/shops": "Delivery points: price tier and assigned drivers.",
  "/delivery-assignments": "Which driver serves which shop: assign, reassign, remove.",
  "/users": "Customers, subscribers, drivers and admins.",
  "/invoices": "GST invoices and credit notes; view or download the PDF.",
  "/gift-cards": "Issue and void gift cards; balances and expiry.",
  "/loyalty": "Points balances per account; manual adjustments.",
  "/churn": "Accounts at risk of lapsing, scored low / medium / high.",
  "/forecast": "Tomorrow's production plan: committed + forecast + safety.",
  "/reorder-suggestions": "Products below their reorder point, with suggested quantities.",
  "/copilot": "Ask the AI copilot about sales, stock and customers.",
  "/notifications": "Outbound SMS/push/email outbox: resend, test, flush.",
  "/webhooks": "Outbound event webhooks: endpoints, tests, delivery log.",
};

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Today's headline numbers, what needs attention, and every area of the DRS admin."
      />
      <OverviewDashboard />
      <h2 className="mt-10 mb-4 text-lg font-semibold text-drs-green">All sections</h2>
      <div className="flex flex-col gap-8">
        {NAV_GROUPS.filter((g) => g.label).map((g) => (
          <section key={g.label} aria-labelledby={`ov-${g.label}`}>
            <h3
              id={`ov-${g.label}`}
              className="mb-3 text-xs leading-4 font-semibold tracking-[0.14em] text-drs-ink/70 uppercase"
            >
              {g.label}
            </h3>
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {g.items.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    className="block h-full rounded-xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <span className="font-semibold text-drs-green">{i.label}</span>
                    <span className="mt-1 block text-sm text-drs-ink/75">{BLURBS[i.href]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
