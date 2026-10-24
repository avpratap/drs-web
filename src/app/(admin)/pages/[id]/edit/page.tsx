"use client";

import { useParams } from "next/navigation";
import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { pageFields } from "@/modules/content/fields";

export default function PageEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader eyebrow={<BackLink href="/pages">Pages</BackLink>} title="Edit page" />
      <ResourceForm
        resource="pages"
        id={id}
        fields={pageFields}
        cancelHref="/pages"
        successHref={() => "/pages"}
      />
    </>
  );
}
