import type { Config } from "tailwindcss";

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
        drs: {
          green: "#0D4C3C",
          gold: "#C5A253",
          cream: "#F4EADE",
          maroon: "#3B0A1E",
          sky: "#6FC5F4",
          ink: "#1E1A1E",
          white: "#FFFFFF",
        },
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
