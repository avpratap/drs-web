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
import { OPTIONS } from "@/modules/options";

type Article = components["schemas"]["ArticleOut"];

const columns: Column<Article>[] = [
  {
    key: "title",
    header: "Article",
    cell: (a) => (
      <TextLink href={`/admin/articles/${a.id}/edit`} sub={`/${a.slug}`}>
        {a.title}
      </TextLink>
    ),
  },
  { key: "cat", header: "Category", hideOnMobile: true, cell: (a) => a.category ?? "—" },
  { key: "pub", header: "Published", hideOnMobile: true, cell: (a) => formatDateTime(a.published_at) },
  { key: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (a) => (
      <div className="flex flex-wrap justify-end">
        <PublishToggle
          status={a.status}
          title={a.title}
          resource="articles"
          publish={() => contentActions.publishArticle(a.id)}
          unpublish={() => contentActions.unpublishArticle(a.id)}
        />
        <RowLink href={`/admin/articles/${a.id}/edit`} srLabel={a.title}>
          Edit
        </RowLink>
        <DeleteButton
          resource="articles"
          id={a.id}
          label="Delete"
          confirmText={`Delete “${a.title}” permanently?`}
        />
      </div>
    ),
  },
];

export default function ArticlesPage() {
  return (
    <ResourceList<Article>
      resource="articles"
      title="Articles"
      description="Blog posts and guides for the app and website."
      columns={columns}
      filters={[{ field: "status", label: "Status", type: "select", options: OPTIONS.contentStatus }]}
      createHref="/admin/articles/create"
      createLabel="New article"
      empty="No articles yet."
    />
  );
}
