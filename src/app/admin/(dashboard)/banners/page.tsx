/* eslint-disable @next/next/no-img-element -- banner images live on arbitrary CDN hosts */
"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { RowLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDate } from "@/lib/format";

type Banner = components["schemas"]["BannerOut"];

const columns: Column<Banner>[] = [
  {
    key: "img",
    header: "Banner",
    cell: (b) => (
      <div className="flex items-center gap-3">
        <img
          src={b.image_url}
          alt=""
          className="h-12 w-20 shrink-0 rounded-md bg-drs-cream object-cover"
          loading="lazy"
        />
        <span className="font-medium">{b.title}</span>
      </div>
    ),
  },
  { key: "pos", header: "Position", className: "tabular-nums", hideOnMobile: true, cell: (b) => b.position },
  {
    key: "window",
    header: "Window",
    hideOnMobile: true,
    cell: (b) =>
      b.valid_from || b.valid_to
        ? `${formatDate(b.valid_from)} → ${b.valid_to ? formatDate(b.valid_to) : "open"}`
        : "Always",
  },
  {
    key: "active",
    header: "Status",
    cell: (b) => (b.active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>),
  },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (b) => (
      <div className="flex justify-end">
        <RowLink href={`/admin/banners/${b.id}/edit`} srLabel={b.title}>
          Edit
        </RowLink>
        <DeleteButton
          resource="banners"
          id={b.id}
          label="Delete"
          confirmText={`Delete the “${b.title}” banner?`}
        />
      </div>
    ),
  },
];

export default function BannersPage() {
  return (
    <ResourceList<Banner>
      resource="banners"
      title="Banners"
      description="Home-screen carousel banners, shown by position within their date window."
      columns={columns}
      createHref="/admin/banners/create"
      createLabel="New banner"
      empty="No banners yet."
    />
  );
}
