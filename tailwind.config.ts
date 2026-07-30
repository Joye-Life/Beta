import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101114",
        mist: "#f5f6f8",
        joye: {
          50: "#eef5ff",
          100: "#d9e9ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(16,17,20,.08)"
      }
    }
  },
  plugins: []
};

export default config;
