/**
 * Absolute URL for a backend media path. The media store returns paths on the API host
 * ("/media/…", signed "/files/…" links); make those absolute against the API origin and
 * accept only http(s) URLs otherwise (anything else would be an unsafe or broken src).
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//"))
    return `${(process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/+$/, "")}${url}`;
  return /^https?:\/\//.test(url) ? url : null;
}
