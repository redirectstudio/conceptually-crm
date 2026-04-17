import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Readiness score colors
        score: {
          1: "#ef4444",
          2: "#f97316",
          3: "#eab308",
          4: "#84cc16",
          5: "#22c55e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
