"use client";

import { useList } from "@refinedev/core";
import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { humanize } from "@/lib/format";
import { operationsActions } from "@/modules/operations/handlers";

type Staff = components["schemas"]["StaffOut"];
type Shop = components["schemas"]["AdminShopRow"];

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "delivery", label: "Delivery" },
];
const STATUSES = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

/** Tick the shops a delivery driver may see; saving replaces their whole scope. */
function ShopScopeDialog({ staff, shops }: { staff: Staff; shops: Shop[] }) {
  const who = staff.full_name || staff.phone;
  return (
    <ActionDialog
      label="Shops"
      ariaLabel={`Shops for ${who}`}
      variant="ghost"
      title={`Shops ${who} can serve`}
      description="They see these shops' stops on their route and can mark them delivered. Removing a shop keeps its history."
      confirmLabel="Save shops"
      defaultValues={{ shop_ids: staff.shop_ids }}
      toBody={(v) => ({ shop_ids: v.shop_ids })}
      onConfirm={(v) => operationsActions.setShopScope(staff.id, v.shop_ids as number[])}
      success="Shop access updated"
      invalidate={["staff", "delivery-assignments"]}
    >
      {(form) => {
        const chosen = (form.watch("shop_ids") as number[] | undefined) ?? [];
        const toggle = (id: number, on: boolean) =>
          form.setValue("shop_ids", on ? [...chosen, id] : chosen.filter((x) => x !== id), {
            shouldDirty: true,
          });
        return (
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-drs-ink">
              Shops <span className="font-normal text-drs-ink/70">({chosen.length} selected)</span>
            </legend>
            {shops.length === 0 ? (
              <p className="mt-2 text-sm text-drs-ink/75">No active shops yet.</p>
            ) : (
              <ul className="mt-2 max-h-72 divide-y divide-drs-ink/10 overflow-y-auto rounded-lg border border-drs-ink/10">
                {shops.map((s) => {
                  const id = `scope-${staff.id}-${s.id}`;
                  return (
                    <li key={s.id} className="flex min-h-11 items-center gap-3 px-3 py-2">
                      <Checkbox
                        id={id}
                        checked={chosen.includes(s.id)}
                        onCheckedChange={(c) => toggle(s.id, c === true)}
                      />
                      <label htmlFor={id} className="min-w-0 flex-1 text-sm text-drs-ink">
                        {s.name}
                        {s.pincode && <span className="ml-1 text-drs-ink/70">· {s.pincode}</span>}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </fieldset>
        );
      }}
    </ActionDialog>
  );
}

export default function StaffPage() {
  const shops = useList<Shop>({
    resource: "shops",
    pagination: { mode: "off" },
    filters: [{ field: "status", operator: "eq", value: "active" }],
  });
  const shopRows = shops.result.data;
  const shopName = new Map(shopRows.map((s) => [s.id, s.name]));

  const columns: Column<Staff>[] = [
    {
      key: "who",
      header: "Staff member",
      cell: (u) => (
        <span className="font-medium">
          {u.full_name || "—"}
          <span className="block text-xs font-normal text-drs-ink/70">{u.phone}</span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (u) => <Badge tone={u.role === "admin" ? "green" : "neutral"}>{humanize(u.role)}</Badge>,
    },
    { key: "status", header: "Status", cell: (u) => <StatusBadge status={u.status} /> },
    {
      key: "scope",
      header: "Shop access",
      cell: (u) =>
        u.all_shops ? (
          <Badge tone="green">All shops</Badge>
        ) : u.shop_ids.length === 0 ? (
          <span className="text-drs-maroon">No shops</span>
        ) : (
          <span className="text-sm">
            {u.shop_ids
              .slice(0, 3)
              .map((id) => shopName.get(id) ?? `Shop #${id}`)
              .join(", ")}
            {u.shop_ids.length > 3 && <span className="text-drs-ink/70"> +{u.shop_ids.length - 3} more</span>}
          </span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (u) =>
        u.role === "delivery" ? (
          <ShopScopeDialog staff={u} shops={shopRows} />
        ) : (
          <span className="text-drs-ink/70">—</span>
        ),
    },
  ];

  return (
    <ResourceList<Staff>
      resource="staff"
      title="Staff & shop access"
      description="Admins see every shop. Delivery drivers only see the shops you give them; change roles under Users."
      columns={columns}
      filters={[
        { field: "q", label: "Search by phone or name", type: "search" },
        { field: "role", label: "Role", type: "select", options: ROLES },
        { field: "status", label: "Status", type: "select", options: STATUSES },
      ]}
      empty="No staff match."
    />
  );
}
