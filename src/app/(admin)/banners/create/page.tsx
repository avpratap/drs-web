"use client";

import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { bannerFields } from "@/modules/content/fields";

export default function BannerCreatePage() {
  return (
    <>
      <PageHeader eyebrow={<BackLink href="/banners">Banners</BackLink>} title="New banner" />
      <ResourceForm
        resource="banners"
        fields={bannerFields}
        defaultValues={{ position: 0, active: true }}
        cancelHref="/banners"
        successHref={() => "/banners"}
        submitLabel="Create banner"
      />
    </>
  );
}
