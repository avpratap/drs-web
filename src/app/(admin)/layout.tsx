import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/layout/auth-guard";

/**
 * Renders the shell and the page straight away (no client-side auth gate) so every admin
 * route has a static shell for instant navigation; `loading.tsx` streams page content.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <AuthGuard />
      {children}
    </AppShell>
  );
}
