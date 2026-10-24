"use client";

import { useParams } from "next/navigation";
import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { bannerFields } from "@/modules/content/fields";

export default function BannerEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader eyebrow={<BackLink href="/banners">Banners</BackLink>} title="Edit banner" />
      <ResourceForm
        resource="banners"
        id={id}
        fields={bannerFields}
        cancelHref="/banners"
        successHref={() => "/banners"}
      />
    </>
  );
}
