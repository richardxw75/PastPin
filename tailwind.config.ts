import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Fris groen, geïnspireerd op ClimateScan
        brand: {
          50: "#f2f9ec",
          100: "#e1f1d4",
          200: "#c3e3ab",
          300: "#9dd07a",
          400: "#7aba50",
          500: "#5c9f33",
          600: "#467f26",
          700: "#376221",
          800: "#2e4f1e",
          900: "#28431c",
        },
        sepia: {
          50: "#faf6ef",
          100: "#f1e8d6",
          500: "#a07c4f",
          700: "#6e5233",
        },
        video: {
          50: "#fff4ed",
          100: "#ffe6d4",
          500: "#f26b1d",
          600: "#dc5512",
          700: "#b64010",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        panel: "0 10px 40px -10px rgba(16, 40, 10, 0.35)",
      },
      keyframes: {
        "slide-up": { from: { transform: "translateY(24px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        "slide-in": { from: { transform: "translateX(24px)", opacity: "0" }, to: { transform: "translateX(0)", opacity: "1" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "slide-up": "slide-up 220ms ease-out",
        "slide-in": "slide-in 220ms ease-out",
        "fade-in": "fade-in 150ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
