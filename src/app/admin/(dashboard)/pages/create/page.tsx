"use client";

import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { pageFields } from "@/modules/content/fields";

export default function PageCreatePage() {
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/admin/pages">Pages</BackLink>}
        title="New page"
        description="Saved as a draft — publish it from the list."
      />
      <ResourceForm
        resource="pages"
        fields={pageFields}
        cancelHref="/admin/pages"
        successHref={() => "/admin/pages"}
        submitLabel="Save draft"
      />
    </>
  );
}
