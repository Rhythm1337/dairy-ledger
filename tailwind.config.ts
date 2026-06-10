import type { Config } from "tailwindcss";

// The app is styled primarily with the inline styles ported from the original
// prototype, but these design tokens are exposed as Tailwind utilities for any
// future Tailwind-based components. Values come from the design system in the spec.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FFFDF8",
          100: "#FAF8F5",
          200: "#F4F0E8",
          300: "#EDE8DF",
          400: "#DDD7CC",
          500: "#B0A898",
        },
        green: {
          800: "#2D4A2D",
          900: "#1A2E1A",
        },
        amber: {
          100: "#FFF3E0",
          600: "#A06020",
        },
        red: {
          400: "#C47070",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
