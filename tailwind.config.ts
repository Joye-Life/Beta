import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1020",
        mist: "#f6f7fc",
        night: "#070916",
        aqua: "#18c5ef",
        mint: "#55e4c9",
        joye: {
          50: "#f7f4ff",
          100: "#eee8ff",
          200: "#ded2ff",
          300: "#c4a8ff",
          400: "#a56dff",
          500: "#8a4bfa",
          600: "#6d34f2",
          700: "#4055f8",
          800: "#2464d8",
          900: "#0b2f78",
          950: "#07142f"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23,31,74,.10)",
        brand: "0 18px 54px rgba(86,63,239,.24)"
      }
    }
  },
  plugins: []
};

export default config;
