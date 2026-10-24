/** Link to a list page pre-filtered (in Refine's syncWithLocation query format). */
export function listHref(path: string, filters: Record<string, string | number | boolean>): string {
  const parts: string[] = [];
  Object.entries(filters).forEach(([field, value], i) => {
    parts.push(
      `filters[${i}][field]=${encodeURIComponent(field)}`,
      `filters[${i}][operator]=eq`,
      `filters[${i}][value]=${encodeURIComponent(String(value))}`,
    );
  });
  return parts.length ? `${path}?${parts.join("&")}` : path;
}
