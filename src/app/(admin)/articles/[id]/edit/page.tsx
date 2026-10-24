"use client";

import { useParams } from "next/navigation";
import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { articleFields, tagsToApi } from "@/modules/content/fields";

export default function ArticleEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader eyebrow={<BackLink href="/articles">Articles</BackLink>} title="Edit article" />
      <ResourceForm
        resource="articles"
        id={id}
        fields={articleFields}
        cancelHref="/articles"
        successHref={() => "/articles"}
        toFormValues={(r) => ({ ...r, tags: Array.isArray(r.tags) ? r.tags.join(", ") : "" })}
        transform={(p) => tagsToApi(p)}
      />
    </>
  );
}
