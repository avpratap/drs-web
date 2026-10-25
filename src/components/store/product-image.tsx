"use client";

import Image from "next/image";
import { useState } from "react";
import { mediaUrl } from "@/lib/media";

/**
 * A product photo from the backend media store (`image_url` → absolute via mediaUrl), or the
 * on-brand category illustration when there's no photo or it fails to load (a 404 or an
 * expired link never leaves a broken-image icon on a card or the PDP).
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  fallback: React.ReactNode;
}) {
  const url = mediaUrl(src);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) return <>{fallback}</>;
  return (
    <Image
      src={url}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      // Served by the media store (already sized); skip the optimizer and its host allow-list.
      unoptimized
      onError={() => setFailedUrl(url)}
    />
  );
}
