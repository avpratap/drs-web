"use client";

import { useList, useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { AccountTypeBadge, BillingModeLabel } from "@/components/billing/account-type-badge";
import { LedgerTable } from "@/components/billing/ledger-table";
import { ActionDialog } from "@/components/resource/action-dialog";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { StatCard, StatGrid } from "@/components/ui/stat";
import { Tabs } from "@/components/ui/tabs";
import type { components } from "@/lib/api/client";
import { money } from "@/lib/format";
import { billingActions } from "@/modules/billing/actions";
import { OPTIONS } from "@/modules/options";

type Account = components["schemas"]["AccountDetailOut"];
type Tier = components["schemas"]["PriceTierOut"];

const REFRESH = ["accounts", "wallet-transactions", "credit-ledger"];

export default function AccountShowPage() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);
  const { result: a, query } = useOne<Account>({ resource: "accounts", id });
  const tiers = useList<Tier>({ resource: "price-tiers", pagination: { mode: "off" } });

  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !a) return <Card>{query.error?.message ?? "Account not found."}</Card>;

  const postpaid = a.billing_mode === "postpaid_credit";

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/accounts">Accounts</BackLink>}
        title={a.full_name || `Account #${a.id}`}
        description={a.phone ? `+91 ${a.phone}` : undefined}
        actions={
          <>
            <ActionDialog
              label="Top up wallet"
              variant="primary"
              fields={[
                { name: "amount", label: "Amount (₹)", type: "money", required: true, gt: 0, max: 1_000_000 },
              ]}
              onConfirm={(v) => billingActions.topup(accountId, v)}
              success="Wallet topped up"
              invalidate={REFRESH}
            />
            <ActionDialog
              label="Adjust wallet"
              description="Use a negative amount to debit. Every adjustment is written to the ledger and audit log."
              fields={[
                {
                  name: "amount",
                  label: "Amount (₹, signed)",
                  type: "money",
                  required: true,
                  min: -10_000_000,
                  max: 10_000_000,
                  validate: (v) => v !== 0 || "Can't be zero",
                },
                {
                  name: "reason",
                  label: "Reason",
                  required: true,
                  minLength: 2,
                  maxLength: 32,
                  placeholder: "goodwill, correction…",
                },
                { name: "note", label: "Note", type: "textarea", maxLength: 255 },
              ]}
              onConfirm={(v) => billingActions.adjustWallet(accountId, v)}
              success="Wallet adjusted"
              invalidate={REFRESH}
            />
            <ActionDialog
              label="Settle credit"
              disabled={a.credit_outstanding <= 0}
              description={`Outstanding: ${money(a.credit_outstanding)}. Records a payment against the credit ledger.`}
              fields={[
                {
                  name: "amount",
                  label: "Amount received (₹)",
                  type: "money",
                  required: true,
                  gt: 0,
                  max: 10_000_000,
                  validate: (v) =>
                    (v as number) <= a.credit_outstanding || "More than the outstanding balance",
                },
                { name: "note", label: "Note", type: "textarea", maxLength: 255 },
              ]}
              onConfirm={(v) => billingActions.settleCredit(accountId, v)}
              success="Settlement recorded"
              invalidate={REFRESH}
            />
          </>
        }
      />

      <StatGrid>
        <StatCard
          label="Wallet balance"
          value={money(a.wallet_balance)}
          accent
          tone={a.wallet_balance < 0 ? "alert" : "default"}
        />
        <StatCard
          label="Credit outstanding"
          value={money(a.credit_outstanding)}
          tone={a.credit_outstanding > 0 ? "alert" : "default"}
        />
        <StatCard label="Orders" value={a.order_count} />
        <StatCard label="Subscriptions" value={a.subscription_count} />
      </StatGrid>

      <Card className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-drs-green">Billing setup</h2>
          <div className="flex flex-wrap gap-2">
            <ActionDialog
              label="Change type"
              variant="ghost"
              defaultValues={{ account_type: a.account_type, billing_mode: a.billing_mode }}
              fields={[
                {
                  name: "account_type",
                  label: "Account type",
                  type: "select",
                  options: OPTIONS.accountType,
                  required: true,
                },
                {
                  name: "billing_mode",
                  label: "Billing mode",
                  type: "select",
                  options: OPTIONS.billingMode,
                  required: true,
                },
              ]}
              onConfirm={(v) => billingActions.setAccountType(accountId, v)}
              success="Account updated"
              invalidate={["accounts"]}
            />
            <ActionDialog
              label="Set price tier"
              variant="ghost"
              defaultValues={{ price_tier_id: a.price_tier_id ?? "" }}
              fields={[
                {
                  name: "price_tier_id",
                  label: "Price tier",
                  type: "select",
                  required: true,
                  options: tiers.result.data.map((t) => ({ value: t.id, label: `${t.name} (${t.code})` })),
                },
              ]}
              onConfirm={(v) => billingActions.setAccountTier(accountId, v)}
              success="Price tier set"
              invalidate={["accounts"]}
            />
          </div>
        </div>
        <DescriptionList
          items={[
            { label: "Type", value: <AccountTypeBadge type={a.account_type} /> },
            { label: "Billing mode", value: <BillingModeLabel mode={a.billing_mode} /> },
            {
              label: "Price tier",
              value: a.price_tier_id
                ? (tiers.result.data.find((t) => t.id === a.price_tier_id)?.name ?? `#${a.price_tier_id}`)
                : "Default",
            },
            { label: "Owner user", value: `#${a.owner_user_id}` },
          ]}
        />
      </Card>

      <section className="mt-8" aria-label="Ledgers">
        <Tabs
          initial={postpaid ? "credit" : "wallet"}
          tabs={[
            {
              id: "wallet",
              label: "Wallet ledger",
              content: (
                <LedgerTable resource="wallet-transactions" accountId={accountId} caption="Wallet ledger" />
              ),
            },
            {
              id: "credit",
              label: "Credit ledger",
              content: <LedgerTable resource="credit-ledger" accountId={accountId} caption="Credit ledger" />,
            },
          ]}
        />
      </section>
    </>
  );
}
