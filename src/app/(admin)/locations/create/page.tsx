"use client";

import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { locationFields } from "@/modules/inventory/fields";

export default function LocationCreatePage() {
  return (
    <>
      <PageHeader eyebrow={<BackLink href="/locations">Locations</BackLink>} title="New location" />
      <ResourceForm
        resource="locations"
        fields={locationFields}
        defaultValues={{ kind: "warehouse", is_default: false }}
        cancelHref="/locations"
        successHref={() => "/locations"}
        submitLabel="Create location"
      />
    </>
  );
}
