import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

// ทุกสีใช้ channel form -> รองรับ opacity (เช่น bg-surface/60) และสลับค่าได้ตามโซน
// โซน tasks (#tasks-module) กับ points (.pb-root) กำหนดค่าตัวแปรของตัวเองใน CSS
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx,css}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        aura: "url(/bg-dark-blue-aura.png)",
      },
      colors: {
        bg: v("--bg"),
        surface: v("--surface"),
        "surface-2": v("--surface-2"),
        line: v("--line"),
        muted: v("--muted"),
        fg: v("--fg"),
        text: v("--text"),
        coral: v("--coral"),
        penalty: v("--penalty"),
        reward: v("--reward"),
        crown: v("--crown"),
        brand: {
          DEFAULT: v("--brand"),
          dark: v("--brand-dark"),
          soft: v("--brand-soft"),
        },
      },
      fontFamily: {
        sans: ["var(--font-thai)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: { card: "0 1px 2px rgba(0,0,0,0.2), 0 8px 24px -12px rgba(0,0,0,0.5)" },
      keyframes: {
        stamp: {
          "0%": { opacity: "0", transform: "translate(-50%,-50%) scale(1.7) rotate(-20deg)" },
          "22%": { opacity: "1", transform: "translate(-50%,-50%) scale(0.88) rotate(-12deg)" },
          "70%": { opacity: "1", transform: "translate(-50%,-50%) scale(1) rotate(-12deg)" },
          "100%": { opacity: "0", transform: "translate(-50%,-50%) scale(1.08) rotate(-12deg)" },
        },
        risein: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        stamp: "stamp 850ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        risein: "risein 260ms ease-out both",
      },
    },
  },
  darkMode: "class",
  plugins: [nextui({ prefix: "jirayu-ui" })],
};
export default config;
