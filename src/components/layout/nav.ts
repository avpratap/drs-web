export const NAV = [
  { href: "/", label: "Overview", icon: "◈" },
  { href: "/products", label: "Products", icon: "▤" },
  { href: "/price-tiers", label: "Price tiers", icon: "◇" },
  { href: "/product-prices", label: "Product prices", icon: "₹" },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
