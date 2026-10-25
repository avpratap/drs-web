import {
  CookieIcon,
  CupSodaIcon,
  DropletIcon,
  GlassWaterIcon,
  MilkIcon,
  PackageIcon,
  type LucideIcon,
} from "lucide-react";

type CategoryMeta = { label: string; blurb: string; icon: LucideIcon; milkLine: boolean };

const KNOWN: Record<string, CategoryMeta> = {
  milk: {
    label: "Milk",
    blurb: "Full cream, toned and A2 — pasteurised at dawn",
    icon: MilkIcon,
    milkLine: true,
  },
  buttermilk: {
    label: "Buttermilk",
    blurb: "Spiced chaas, churned the traditional way",
    icon: GlassWaterIcon,
    milkLine: true,
  },
  curd: { label: "Curd", blurb: "Set overnight in small batches", icon: CupSodaIcon, milkLine: false },
  paneer: {
    label: "Paneer",
    blurb: "Soft, fresh and pressed the same day",
    icon: PackageIcon,
    milkLine: false,
  },
  ghee: {
    label: "Ghee",
    blurb: "Slow-cooked bilona ghee with a golden grain",
    icon: DropletIcon,
    milkLine: false,
  },
  sweets: { label: "Sweets", blurb: "Milk sweets from our own kitchens", icon: CookieIcon, milkLine: false },
};

const title = (s: string) => s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Display metadata for a backend category slug (falls back gracefully for new categories). */
export function categoryMeta(slug: string): CategoryMeta & { slug: string } {
  const key = slug.trim().toLowerCase();
  return {
    slug: key,
    ...(KNOWN[key] ?? {
      label: title(key),
      blurb: "Fresh from the DRS dairy",
      icon: PackageIcon,
      milkLine: false,
    }),
  };
}

export const categoryHref = (slug: string) => `/products?category=${encodeURIComponent(slug)}`;
const kebab = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Product URLs are `/products/{id}-{name}`: the id is the key, the name is for people and SEO. */
export const productSlug = (p: { id: number; name: string }) =>
  [p.id, kebab(p.name)].filter(Boolean).join("-");
export const productHref = (p: { id: number; name: string }) => `/products/${productSlug(p)}`;

/** The product id at the front of a slug ("12-a2-desi-ghee" -> 12), or null when it has none. */
export function productIdFromSlug(slug: string): number | null {
  const m = /^(\d+)(?:-|$)/.exec(slug);
  const id = m ? Number(m[1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
