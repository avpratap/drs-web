import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Storefront defaults (indexable). The admin overrides these with its own noindex metadata. */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "DRS Dairy · Farm-fresh milk, delivered daily", template: "%s · DRS Dairy" },
  description:
    "Farm-fresh milk, buttermilk, paneer and ghee from DRS, delivered to your door every morning. Subscribe or order once.",
  applicationName: "DRS Dairy",
  openGraph: { type: "website", siteName: "DRS Dairy", locale: "en_IN" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0D4C3C", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={poppins.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
