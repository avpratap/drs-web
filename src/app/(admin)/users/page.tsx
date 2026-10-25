"use client";

import { ActionDialog } from "@/components/resource/action-dialog";
import { ExportCsvButton } from "@/components/resource/export-csv";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import type { Column } from "@/components/ui/table";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { unwrap } from "@/lib/api/resource";
import { humanize } from "@/lib/format";
import { OPTIONS } from "@/modules/options";

type User = components["schemas"]["UserAdminOut"];

const columns: Column<User>[] = [
  {
    key: "user",
    header: "User",
    cell: (u) => (
      <span className="font-medium">
        {u.full_name || "—"}
        <span className="block text-xs font-normal text-drs-ink/70">{u.phone}</span>
      </span>
    ),
  },
  {
    key: "email",
    header: "Email",
    hideOnMobile: true,
    cell: (u) => <span className="break-all">{u.email ?? "—"}</span>,
  },
  {
    key: "role",
    header: "Role",
    cell: (u) => <Badge tone={u.role === "admin" ? "green" : "neutral"}>{humanize(u.role)}</Badge>,
  },
  { key: "status", header: "Status", cell: (u) => <StatusBadge status={u.status} /> },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (u) =>
      u.status === "erased" ? (
        <span className="text-drs-ink/70">—</span>
      ) : (
        <ActionDialog
          label="Edit"
          ariaLabel={`Edit ${u.full_name || u.phone}`}
          variant="ghost"
          title={`Edit ${u.full_name || u.phone}`}
          description="Changing the role signs the user out everywhere so it takes effect immediately."
          defaultValues={{ role: u.role, status: u.status }}
          fields={[
            { name: "role", label: "Role", type: "select", required: true, options: OPTIONS.userRole },
            {
              name: "status",
              label: "Status",
              type: "select",
              required: true,
              options: OPTIONS.userStatus.filter((o) => o.value !== "erased"),
            },
          ]}
          onConfirm={(v) =>
            unwrap(
              api.PATCH("/api/v1/admin/users/{user_id}", {
                params: { path: { user_id: u.id } },
                body: v as components["schemas"]["UserPatch"],
              }),
            )
          }
          success="User updated"
          invalidate={["users"]}
        />
      ),
  },
];

export default function UsersPage() {
  return (
    <ResourceList<User>
      actions={<ExportCsvButton kind="users" />}
      resource="users"
      title="Users & staff"
      description="Everyone who can sign in: customers, B2B subscribers, delivery drivers and admins."
      columns={columns}
      filters={[
        { field: "q", label: "Search by phone or name", type: "search" },
        { field: "role", label: "Role", type: "select", options: OPTIONS.userRole },
        { field: "status", label: "Status", type: "select", options: OPTIONS.userStatus },
      ]}
      empty="No users match."
    />
  );
}
