import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0C10",
          soft: "#0D0F14",
        },
        surface: {
          DEFAULT: "#12151B",
          raised: "#1A1E26",
        },
        line: "#242933",
        "line-soft": "#1B1F27",
        fg: {
          DEFAULT: "#EDEFF3",
          dim: "#9096A3",
          faint: "#5D6270",
        },
        signal: {
          DEFAULT: "#E7B84C",
          dim: "#B9924A",
          soft: "#3A2F1A",
        },
        high: {
          DEFAULT: "#F2645C",
          soft: "#3A1E1D",
        },
        med: {
          DEFAULT: "#5B8DEF",
          soft: "#1A2436",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "scan-line": "linear-gradient(180deg, transparent, rgba(231,184,76,0.5), transparent)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        scan: "scan 1.8s linear infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
