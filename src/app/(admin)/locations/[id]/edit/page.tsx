"use client";

import { useParams } from "next/navigation";
import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { locationFields } from "@/modules/inventory/fields";

export default function LocationEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader eyebrow={<BackLink href="/locations">Locations</BackLink>} title="Edit location" />
      <ResourceForm
        resource="locations"
        id={id}
        fields={locationFields}
        cancelHref="/locations"
        successHref={() => "/locations"}
      />
    </>
  );
}
