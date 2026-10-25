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
export const productHref = (id: number) => `/products/${id}`;
