import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import { RefineProvider } from "@/providers/refine-provider";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "DRS Admin", template: "%s · DRS Admin" },
  description: "DRS dairy platform — admin dashboard",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0D4C3C", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <Suspense>
          <RefineProvider>{children}</RefineProvider>
        </Suspense>
      </body>
    </html>
  );
}
