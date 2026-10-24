"use client";

import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { articleFields, tagsToApi } from "@/modules/content/fields";

export default function ArticleCreatePage() {
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/articles">Articles</BackLink>}
        title="New article"
        description="Saved as a draft — publish it from the list."
      />
      <ResourceForm
        resource="articles"
        fields={articleFields}
        cancelHref="/articles"
        successHref={() => "/articles"}
        submitLabel="Save draft"
        transform={(p) => tagsToApi(p)}
      />
    </>
  );
}
