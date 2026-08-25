import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#201e1c",
        "ink-soft": "#6b6459",
        paper: "#f7f5f1",
        line: "#e9e5dc",
        accent: {
          DEFAULT: "#1f5c4f",
          dark: "#173f37",
          tint: "#e4efec",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 6px 20px rgba(32, 30, 28, 0.07)",
        softer: "0 2px 8px rgba(32, 30, 28, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
