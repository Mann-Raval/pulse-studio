import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "tertiary-fixed": "#ffddb8",
        "surface-container-high": "#282a2d",
        "primary-container": "#6366f1",
        "surface-container-highest": "#333538",
        "on-secondary-fixed": "#001f26",
        "outline-variant": "#464554",
        "surface-bright": "#37393d",
        "secondary": "#4cd7f6",
        "surface-variant": "#333538",
        "on-error": "#690005",
        "on-secondary-container": "#00424e",
        "tertiary": "#ffb95f",
        "error-container": "#93000a",
        "secondary-container": "#03b5d3",
        "primary-fixed-dim": "#c0c1ff",
        "tertiary-fixed-dim": "#ffb95f",
        "on-surface-variant": "#c7c4d7",
        "surface-tint": "#c0c1ff",
        "outline": "#908fa0",
        "surface-container": "#1e2023",
        "surface-container-lowest": "#0c0e11",
        "inverse-primary": "#494bd6",
        "on-primary": "#ffffff",
        "inverse-surface": "#e2e2e6",
        "background": "#111317",
        "on-primary-fixed-variant": "#2f2ebe",
        "on-tertiary-container": "#3e2400",
        "on-tertiary-fixed": "#2a1700",
        "on-primary-fixed": "#07006c",
        "secondary-fixed-dim": "#4cd7f6",
        "on-secondary-fixed-variant": "#004e5c",
        "inverse-on-surface": "#2f3034",
        "surface-container-low": "#1a1c1f",
        "on-tertiary-fixed-variant": "#653e00",
        "primary": "#6366f1",
        "on-secondary": "#003640",
        "error": "#ffb4ab",
        "on-tertiary": "#472a00",
        "primary-fixed": "#e1e0ff",
        "on-primary-container": "#ffffff",
        "surface": "#111317",
        "on-background": "#e2e2e6",
        "on-error-container": "#ffdad6",
        "on-surface": "#e2e2e6",
        "surface-dim": "#111317",
        "tertiary-container": "#ca8100",
        "secondary-fixed": "#acedff"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "sm": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.375rem",
        "full": "9999px"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
} satisfies Config
