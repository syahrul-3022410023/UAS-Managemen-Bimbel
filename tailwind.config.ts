import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        // Fallback ke system fonts untuk Apple aesthetic (SF Pro)
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji"
        ]
      },
      colors: {
        ink: "#111827",
        surface: "#F2F2F3",
        surfaceDim: "#ECEEF5",
        brand: "#2563EB",
        brandHover: "#1D4ED8",
        accent: "#06B6D4",
        success: "#16A34A",
      },
      boxShadow: {
        'apple-soft': 'none',
        'apple-hover': 'none',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    }
  },
  plugins: []
};

export default config;
