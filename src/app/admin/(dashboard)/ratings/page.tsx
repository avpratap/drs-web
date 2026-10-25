"use client";

import { Stars } from "@/components/customers/badges";
import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { useApiAction } from "@/lib/use-api-action";
import { customerActions } from "@/modules/customers/handlers";
import { useInventoryLookups } from "@/modules/inventory/lookups";
import { OPTIONS } from "@/modules/options";

type Rating = components["schemas"]["RatingAdminOut"];

function Moderate({ r }: { r: Rating }) {
  const { run, pending } = useApiAction();
  const set = (status: string, msg: string) =>
    run(() => customerActions.moderateRating(r.id, status), { success: msg, invalidate: ["ratings"] }).catch(
      () => undefined,
    );
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {r.status !== "approved" && (
        <Button
          variant="ghost"
          aria-label={`Approve review ${r.id}`}
          disabled={pending}
          onClick={() => set("approved", "Review approved")}
        >
          Approve
        </Button>
      )}
      {r.status !== "rejected" && (
        <Button
          variant="ghost"
          aria-label={`Reject review ${r.id}`}
          className="text-drs-maroon hover:bg-drs-maroon/10"
          disabled={pending}
          onClick={() => set("rejected", "Review rejected")}
        >
          Reject
        </Button>
      )}
      {r.status === "approved" && (
        <Button
          variant="ghost"
          aria-label={`Hide review ${r.id}`}
          disabled={pending}
          onClick={() => set("hidden", "Review hidden")}
        >
          Hide
        </Button>
      )}
      <ActionDialog
        label={r.admin_reply ? "Edit reply" : "Reply"}
        variant="ghost"
        title="Public reply"
        description="Shown under the review on the product page."
        defaultValues={{ reply: r.admin_reply ?? "" }}
        fields={[{ name: "reply", label: "Reply", type: "textarea", required: true, maxLength: 1000 }]}
        onConfirm={(v) => customerActions.replyRating(r.id, v)}
        success="Reply saved"
        invalidate={["ratings"]}
      />
    </div>
  );
}

export default function RatingsPage() {
  const lk = useInventoryLookups();
  const columns: Column<Rating>[] = [
    {
      key: "review",
      header: "Review",
      cell: (r) => (
        <div className="max-w-md">
          <div className="flex flex-wrap items-center gap-2">
            <Stars value={r.stars} />
            {r.verified_purchase && <Badge tone="green">Verified</Badge>}
          </div>
          <p className="mt-1 text-xs text-drs-ink/70">
            {lk.productName(r.product_id)} · user #{r.user_id}
          </p>
          {r.comment && <p className="mt-1 text-sm whitespace-pre-wrap">{r.comment}</p>}
          {r.admin_reply && (
            <p className="mt-2 border-l-2 border-drs-green/40 pl-2 text-xs text-drs-ink/80">
              <span className="font-semibold">DRS:</span> {r.admin_reply}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "helpful",
      header: "Helpful",
      hideOnMobile: true,
      className: "tabular-nums",
      cell: (r) => r.helpful_count,
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "Actions", className: "text-right", cell: (r) => <Moderate r={r} /> },
  ];
  return (
    <ResourceList<Rating>
      resource="ratings"
      title="Ratings"
      description="Moderate product reviews before they appear on the storefront."
      columns={columns}
      filters={[
        { field: "status", label: "Status", type: "select", options: OPTIONS.ratingStatus },
        { field: "product_id", label: "Product", type: "select", options: lk.productOptions },
      ]}
      initialFilters={[{ field: "status", operator: "eq", value: "pending" }]}
      empty="No reviews to moderate."
    />
  );
}
