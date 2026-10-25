import Link from "next/link";
import { PageHeader } from "@/components/ui/card";
import { NAV_GROUPS } from "@/components/layout/nav";
import { OverviewDashboard } from "@/components/overview/dashboard";

const BLURBS: Record<string, string> = {
  "/admin/products": "SKUs, units, GST & HSN, pack variants.",
  "/admin/price-tiers": "Retail and B2B tiers.",
  "/admin/product-prices": "Tiered prices with validity windows.",
  "/admin/accounts": "Wallets, credit, top-ups, settlements.",
  "/admin/withdrawals": "Approve or reject wallet payouts.",
  "/admin/payments": "Gateway payments and refunds.",
  "/admin/refunds": "Refund status and reconciliation.",
  "/admin/stock": "On-hand, low stock, reorder suggestions.",
  "/admin/batches": "Lots by expiry (FEFO), receipts, write-offs.",
  "/admin/locations": "Plants, hubs, cold storage, vehicles.",
  "/admin/transfers": "Move stock between locations.",
  "/admin/suppliers": "Vendors for purchase orders.",
  "/admin/purchase-orders": "Order, place and receive (GRN).",
  "/admin/boms": "Recipes for production.",
  "/admin/production-orders": "Plan, start and complete production.",
  "/admin/delivery": "Today's stops, cash collected, proof of delivery.",
  "/admin/orders": "One-off orders; cancel and refund.",
  "/admin/reports": "Revenue, orders, top products.",
  "/admin/audit-log": "Every admin write.",
  "/admin/banners": "Home-screen carousel.",
  "/admin/articles": "Blog posts and guides.",
  "/admin/pages": "About, FAQs, policies.",
  "/admin/newsletter": "Subscribers.",
  "/admin/tickets": "Customer support conversations.",
  "/admin/ratings": "Moderate product reviews.",
  "/admin/coupons": "Checkout discount codes.",
  "/admin/feature-flags": "Switch features on and off.",
  "/admin/cutoff": "Nightly order cutoff: status, history, manual run.",
  "/admin/returns": "Approve, reject and refund customer returns.",
  "/admin/subscriptions": "Standing orders: lines, pause, resume, cancel.",
  "/admin/shops": "Delivery points: price tier and assigned drivers.",
  "/admin/delivery-assignments": "Which driver serves which shop: assign, reassign, remove.",
  "/admin/users": "Customers, subscribers, drivers and admins.",
  "/admin/invoices": "GST invoices and credit notes; view or download the PDF.",
  "/admin/gift-cards": "Issue and void gift cards; balances and expiry.",
  "/admin/loyalty": "Points balances per account; manual adjustments.",
  "/admin/churn": "Accounts at risk of lapsing, scored low / medium / high.",
  "/admin/forecast": "Tomorrow's production plan: committed + forecast + safety.",
  "/admin/reorder-suggestions": "Products below their reorder point, with suggested quantities.",
  "/admin/copilot": "Ask the AI copilot about sales, stock and customers.",
  "/admin/notifications": "Outbound SMS/push/email outbox: resend, test, flush.",
  "/admin/webhooks": "Outbound event webhooks: endpoints, tests, delivery log.",
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
