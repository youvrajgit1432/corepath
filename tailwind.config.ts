import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
      colors: {
        "core-bg": "#020617",
        "core-surface": "rgba(15, 23, 42, 0.85)",
        "core-border": "rgba(148, 163, 184, 0.17)",
        "core-text": "#e2e8f0",
        "core-muted": "#94a3b8",
        "core-heading": "#f8fafc",
        "core-accent": "#7c3aed",
        "core-accent-soft": "rgba(124, 58, 237, 0.12)",
      },
      boxShadow: {
        soft: "0 24px 90px rgba(15, 23, 42, 0.32)",
        glow: "0 0 40px rgba(124, 58, 237, 0.18)",
      },
      backgroundImage: {
        "radial-glow": "radial-gradient(circle at top left, rgba(124, 58, 237, 0.14), transparent 36%), radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.12), transparent 28%)",
      },
    },
  },
  plugins: [],
};

export default config;
