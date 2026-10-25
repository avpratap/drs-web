import { ShopsProvider } from "@/components/store/b2b/shops";

/** B2B self-service (the proxy admits subscribers only): every page shares the shop choice. */
export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <ShopsProvider>{children}</ShopsProvider>;
}
