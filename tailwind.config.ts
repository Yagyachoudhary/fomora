import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5F1EA",
        "cream-2": "#EFEAE0",
        ink: "#1A1714",
        "ink-soft": "#4A4640",
        muted: "#8A857C",
        rule: "#D9D2C5",
        brand: { DEFAULT: "#D63B2D", deep: "#B72E22" },
        navy: "#0E2A47",
        leaf: "#6FAA5C",
        gold: "#D9A02B"
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
