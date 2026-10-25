"use client";

import { useNotification } from "@refinedev/core";
import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { money } from "@/lib/format";
import { formatDate } from "@/lib/forms";
import { useApiAction } from "@/lib/use-api-action";
import { engagementActions } from "@/modules/engagement/handlers";
import { useAccountOptions } from "@/modules/engagement/use-account-options";
import { OPTIONS } from "@/modules/options";

type Card = components["schemas"]["GiftCardAdminOut"];

function VoidCard({ card }: { card: Card }) {
  const { run, pending } = useApiAction();
  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="ghost"
          className="text-drs-maroon hover:bg-drs-maroon/10"
          aria-label={`Void gift card ${card.code}`}
        >
          Void
        </Button>
      }
      title={`Void gift card ${card.code}?`}
      description={`Its remaining balance of ${money(card.balance)} can no longer be redeemed. This can't be undone.`}
      confirmLabel="Void card"
      danger
      pending={pending}
      onConfirm={() =>
        run(() => engagementActions.voidGiftCard(card.id), {
          success: "Gift card voided",
          invalidate: ["gift-cards"],
        })
      }
    />
  );
}

export default function GiftCardsPage() {
  const accounts = useAccountOptions();
  const { open } = useNotification();
  const columns: Column<Card>[] = [
    {
      key: "code",
      header: "Code",
      cell: (c) => (
        <span className="font-mono text-sm font-medium tracking-wider text-drs-green">{c.code}</span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      className: "tabular-nums",
      cell: (c) => (
        <span>
          {money(c.balance)}
          <span className="block text-xs text-drs-ink/70">of {money(c.initial_amount)}</span>
        </span>
      ),
    },
    {
      key: "to",
      header: "Issued to",
      hideOnMobile: true,
      cell: (c) =>
        c.issued_to_account_id ? (
          <TextLink href={`/accounts/${c.issued_to_account_id}`}>
            {accounts.name(c.issued_to_account_id)}
          </TextLink>
        ) : (
          <span className="text-drs-ink/70">Bearer card</span>
        ),
    },
    {
      key: "exp",
      header: "Expires",
      hideOnMobile: true,
      cell: (c) => (c.expires_at ? formatDate(c.expires_at) : "Never"),
    },
    { key: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (c) =>
        c.status === "active" ? <VoidCard card={c} /> : <span className="text-drs-ink/70">—</span>,
    },
  ];

  return (
    <ResourceList<Card>
      resource="gift-cards"
      title="Gift cards"
      description="Prepaid codes customers redeem at checkout. Issue a card to an account or as a bearer card."
      columns={columns}
      filters={[
        { field: "status", label: "Status", type: "select", options: OPTIONS.giftCardStatus },
        {
          field: "issued_to",
          label: "Issued to",
          type: "select",
          options: accounts.options,
          allLabel: "Anyone",
        },
      ]}
      actions={
        <ActionDialog
          label="Issue gift card"
          variant="primary"
          description="A unique code is generated. Leave the account empty for a bearer card anyone can redeem."
          fields={[
            { name: "amount", label: "Amount (₹)", type: "money", required: true, gt: 0, max: 10_000_000 },
            {
              name: "issued_to_account_id",
              label: "Issue to account",
              type: "select",
              options: accounts.options,
              placeholder: "Bearer card (no account)",
            },
            {
              name: "expires_at",
              label: "Expires on",
              type: "date",
              placeholder: "Never expires",
              hint: "Optional",
            },
          ]}
          onConfirm={async (v) => {
            const card = await engagementActions.issueGiftCard(v);
            open?.({
              type: "success",
              message: `Gift card ${card.code} issued`,
              description: `${money(card.balance)}${card.expires_at ? ` · expires ${formatDate(card.expires_at)}` : ""}`,
            });
            return card;
          }}
          invalidate={["gift-cards"]}
        />
      }
      empty="No gift cards match."
    />
  );
}
