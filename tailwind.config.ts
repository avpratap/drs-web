import type { Config } from "tailwindcss";
import { DRS } from "./src/lib/brand";

/**
 * DRS brand palette. Usage rules:
 * - Backgrounds: cream (content) / green (chrome). Text: ink.
 * - gold: SPARING accent (≤10% of a screen) — indicators, icons, thin rules. Never a big fill.
 * - sky: ONLY for the milk / buttermilk line.
 * - 3–4 colours per screen.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        drs: DRS,
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      screens: {
        // Mobile-first: base = 360px; then 768 / 1024 / 1440.
        md: "768px",
        lg: "1024px",
        xl: "1440px",
      },
    },
  },
};

export default config;
