"use client";

import { PublishToggle } from "@/components/content/publish-toggle";
import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { RowLink, TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import { contentActions } from "@/modules/content/handlers";

type Page = components["schemas"]["PageOut"];

const columns: Column<Page>[] = [
  {
    key: "title",
    header: "Page",
    cell: (p) => (
      <TextLink href={`/admin/pages/${p.id}/edit`} sub={`/${p.slug}`}>
        {p.title}
      </TextLink>
    ),
  },
  { key: "pub", header: "Published", hideOnMobile: true, cell: (p) => formatDateTime(p.published_at) },
  { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (p) => (
      <div className="flex flex-wrap justify-end">
        <PublishToggle
          status={p.status}
          title={p.title}
          resource="pages"
          publish={() => contentActions.publishPage(p.id)}
          unpublish={() => contentActions.unpublishPage(p.id)}
        />
        <RowLink href={`/admin/pages/${p.id}/edit`} srLabel={p.title}>
          Edit
        </RowLink>
        <DeleteButton
          resource="pages"
          id={p.id}
          label="Delete"
          confirmText={`Delete “${p.title}” permanently?`}
        />
      </div>
    ),
  },
];

export default function PagesPage() {
  return (
    <ResourceList<Page>
      resource="pages"
      title="Pages"
      description="Static pages: about, FAQs, policies."
      columns={columns}
      createHref="/admin/pages/create"
      createLabel="New page"
      empty="No pages yet."
    />
  );
}
