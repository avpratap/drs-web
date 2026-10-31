"use client";

import "./globals.css";
import { ErrorState, type BoundaryProps } from "@/components/store/error-state";

/** Replaces the root layout when it fails itself, so it brings its own <html> and <body>. */
export default function GlobalError(props: BoundaryProps) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen bg-drs-cream font-sans text-drs-ink antialiased">
        <main id="main">
          <ErrorState
            {...props}
            body="DRS Dairy is having trouble right now. Please try again in a moment."
          />
        </main>
      </body>
    </html>
  );
}
