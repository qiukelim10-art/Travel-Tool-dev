import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Segoe UI\"",
          "\"PingFang SC\"",
          "\"Hiragino Sans GB\"",
          "\"Microsoft YaHei\"",
          "sans-serif"
        ]
      },
      colors: {
        ink: "#24302f",
        paper: "#f7f4ec",
        moss: "#3e6654",
        terracotta: "#b76445",
        amberline: "#d9a441",
        sky: "#dcecf2",
        route: "#2f6f73",
        stamp: "#8f5b3f",
        sandlight: "#fbf7ed",
        signal: "#315a7d"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(36, 48, 47, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
