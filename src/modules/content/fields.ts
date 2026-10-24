import type { FieldDef } from "@/components/resource/fields";

const SLUG = {
  value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  message: "Lowercase letters, digits and single hyphens (e.g. ghee-benefits)",
};
const URL = { value: /^https?:\/\/\S+$/, message: "Must be an http(s) URL" };

export const bannerFields: FieldDef[] = [
  { name: "title", label: "Title", required: true, maxLength: 255 },
  { name: "image_url", label: "Image URL", type: "url", required: true, maxLength: 512, pattern: URL },
  {
    name: "cta_link",
    label: "Link (on tap)",
    maxLength: 512,
    hint: "App route or https URL",
    nullable: true,
  },
  {
    name: "position",
    label: "Position",
    type: "number",
    step: 1,
    min: -1_000_000,
    max: 1_000_000,
    hint: "Lower shows first",
  },
  { name: "valid_from", label: "Show from", type: "date", nullable: true },
  {
    name: "valid_to",
    label: "Show until",
    type: "date",
    nullable: true,
    validate: (v, all) =>
      !v || !all.valid_from || (v as string) >= (all.valid_from as string) || "Ends before it starts",
  },
  { name: "active", label: "Active", type: "checkbox" },
];

export const articleFields: FieldDef[] = [
  { name: "title", label: "Title", required: true, maxLength: 255 },
  {
    name: "slug",
    label: "Slug",
    required: true,
    maxLength: 160,
    pattern: SLUG,
    createOnly: true,
    hint: "URL path, e.g. a2-milk-explained",
  },
  { name: "category", label: "Category", maxLength: 64, nullable: true },
  { name: "author_name", label: "Author", maxLength: 120, nullable: true },
  { name: "tags", label: "Tags", hint: "Comma separated", maxLength: 500, nullable: true },
  {
    name: "cover_image_url",
    label: "Cover image URL",
    type: "url",
    maxLength: 512,
    pattern: URL,
    nullable: true,
  },
  { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2, maxLength: 500, nullable: true },
  { name: "body_html", label: "Body (HTML)", type: "textarea", rows: 14, required: true, maxLength: 100_000 },
  { name: "meta_title", label: "SEO title", maxLength: 255, nullable: true },
  { name: "meta_description", label: "SEO description", maxLength: 320, nullable: true },
];

export const pageFields: FieldDef[] = [
  { name: "title", label: "Title", required: true, maxLength: 255 },
  {
    name: "slug",
    label: "Slug",
    required: true,
    maxLength: 160,
    pattern: SLUG,
    createOnly: true,
    hint: "e.g. about-us, shipping-policy",
  },
  { name: "body_html", label: "Body (HTML)", type: "textarea", rows: 14, required: true, maxLength: 100_000 },
  { name: "meta_title", label: "SEO title", maxLength: 255, nullable: true },
  { name: "meta_description", label: "SEO description", maxLength: 320, nullable: true },
];

/** Tags are a comma-separated input but a string[] in the API. */
export function tagsToApi(payload: Record<string, unknown>): Record<string, unknown> {
  if (typeof payload.tags !== "string") return payload;
  const tags = payload.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return { ...payload, tags: tags.length ? tags : null };
}
