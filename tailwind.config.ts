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
        ink: "#1D1D1F", // Apple standard dark text
        surface: "#F5F5F7", // Apple standard light gray background
        surfaceDim: "#E8E8ED",
        brand: "#0071E3", // Apple standard blue
        brandHover: "#0077ED",
        accent: "#F56300",
        success: "#34C759", // Apple green
      },
      boxShadow: {
        'apple-soft': '0 4px 24px rgba(0, 0, 0, 0.04)',
        'apple-hover': '0 10px 40px rgba(0, 0, 0, 0.08)',
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
