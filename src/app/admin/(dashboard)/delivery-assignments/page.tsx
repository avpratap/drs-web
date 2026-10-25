"use client";

import { useList } from "@refinedev/core";
import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import { operationsActions } from "@/modules/operations/handlers";
import { OPTIONS } from "@/modules/options";

type Assignment = components["schemas"]["AdminDeliveryAssignmentRow"];
type Shop = components["schemas"]["AdminShopRow"];
type User = components["schemas"]["UserAdminOut"];

const REFRESH = ["delivery-assignments", "shops"];

export default function DeliveryAssignmentsPage() {
  const drivers = useList<User>({
    resource: "users",
    pagination: { mode: "off" },
    filters: [{ field: "role", operator: "eq", value: "delivery" }],
  });
  const shops = useList<Shop>({
    resource: "shops",
    pagination: { mode: "off" },
    filters: [{ field: "status", operator: "eq", value: "active" }],
  });
  const driverLabel = (u: User) => `${u.full_name || "Driver"} · ${u.phone}`;
  const driverOptions = drivers.result.data.map((u) => ({ value: u.id, label: driverLabel(u) }));
  const activeDriverOptions = drivers.result.data
    .filter((u) => u.status === "active")
    .map((u) => ({ value: u.id, label: driverLabel(u) }));
  const shopOptions = shops.result.data.map((s) => ({
    value: s.id,
    label: [s.name, s.pincode].filter(Boolean).join(" · "),
  }));

  const columns: Column<Assignment>[] = [
    {
      key: "driver",
      header: "Driver",
      cell: (a) => (
        <span className="font-medium">
          {a.driver_name || "Driver"}
          <span className="block text-xs font-normal text-drs-ink/70">{a.driver_phone ?? "—"}</span>
          {a.driver_status && a.driver_status !== "active" && (
            <span className="mt-1 block">
              <StatusBadge status={a.driver_status} />
            </span>
          )}
        </span>
      ),
    },
    {
      key: "shop",
      header: "Shop",
      cell: (a) => (
        <TextLink href={`/admin/shops/${a.shop_id}`} sub={a.shop_pincode ?? undefined}>
          {a.shop_name ?? `Shop #${a.shop_id}`}
        </TextLink>
      ),
    },
    {
      key: "state",
      header: "Status",
      cell: (a) => (a.active ? <Badge tone="green">Assigned</Badge> : <Badge>Removed</Badge>),
    },
    {
      key: "since",
      header: "Created",
      hideOnMobile: true,
      cell: (a) => formatDateTime(a.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (a) => {
        const who = a.driver_name || a.driver_phone || "driver";
        const where = a.shop_name ?? `shop #${a.shop_id}`;
        return a.active ? (
          <ActionDialog
            label="Unassign"
            ariaLabel={`Unassign ${who} from ${where}`}
            variant="ghost"
            triggerClassName="text-drs-maroon hover:bg-drs-maroon/10"
            confirmVariant="danger"
            title={`Unassign ${who} from ${where}?`}
            description="They stop seeing this shop on their route from the next delivery. History is kept."
            onConfirm={() => operationsActions.unassignDriver(a.id)}
            success="Driver unassigned"
            invalidate={REFRESH}
          />
        ) : (
          <ActionDialog
            label="Reassign"
            ariaLabel={`Reassign ${who} to ${where}`}
            variant="ghost"
            title={`Reassign ${who} to ${where}?`}
            description="Restores this driver on the shop's route from the next delivery."
            onConfirm={() => operationsActions.assignDriver(a.shop_id, a.delivery_id)}
            success="Driver reassigned"
            invalidate={REFRESH}
          />
        );
      },
    },
  ];

  return (
    <ResourceList<Assignment>
      resource="delivery-assignments"
      title="Driver assignments"
      description="Which delivery driver serves which shop. A driver can cover many shops; a shop can have several drivers."
      columns={columns}
      initialFilters={[{ field: "active", operator: "eq", value: "true" }]}
      filters={[
        {
          field: "delivery_id",
          label: "Driver",
          type: "select",
          options: driverOptions,
          allLabel: "All drivers",
        },
        { field: "shop_id", label: "Shop", type: "select", options: shopOptions, allLabel: "All shops" },
        { field: "active", label: "Status", type: "select", options: OPTIONS.assignmentState },
      ]}
      actions={
        <ActionDialog
          label="Assign driver"
          variant="primary"
          disabled={activeDriverOptions.length === 0 || shopOptions.length === 0}
          description="The driver sees this shop's stops on their route and can mark them delivered."
          fields={[
            {
              name: "delivery_id",
              label: "Driver",
              type: "select",
              required: true,
              options: activeDriverOptions,
            },
            { name: "shop_id", label: "Shop", type: "select", required: true, options: shopOptions },
          ]}
          onConfirm={(v) => operationsActions.assignDriver(v.shop_id as number, v.delivery_id as number)}
          success="Driver assigned"
          invalidate={REFRESH}
        />
      }
      empty="No assignments match."
    />
  );
}
