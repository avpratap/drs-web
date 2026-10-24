"use client";

import { ActionDialog } from "@/components/resource/action-dialog";

export function PublishToggle({
  status,
  title,
  resource,
  publish,
  unpublish,
}: {
  status: string;
  title: string;
  resource: string;
  publish: () => Promise<unknown>;
  unpublish: () => Promise<unknown>;
}) {
  return status === "published" ? (
    <ActionDialog
      label="Unpublish"
      variant="ghost"
      title={`Unpublish “${title}”?`}
      description="It disappears from the app and website but is kept as a draft."
      onConfirm={unpublish}
      success="Unpublished"
      invalidate={[resource]}
    />
  ) : (
    <ActionDialog
      label="Publish"
      variant="ghost"
      title={`Publish “${title}”?`}
      description="It goes live on the app and website immediately."
      onConfirm={publish}
      success="Published"
      invalidate={[resource]}
    />
  );
}
