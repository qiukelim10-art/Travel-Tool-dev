import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#24302f",
        paper: "#f7f4ec",
        moss: "#3e6654",
        terracotta: "#b76445",
        amberline: "#d9a441"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(36, 48, 47, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
