import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system — see DESIGN.md
        // Every token below resolves through a CSS variable defined in
        // globals.css for :root (light) and .dark, so existing classes
        // like `bg-paper` or `text-ink` automatically theme correctly —
        // no per-component `dark:` variants required for the base palette.
        paper: "rgb(var(--c-paper) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        surfaceMuted: "rgb(var(--c-surface-muted) / <alpha-value>)",
        surfaceRaised: "rgb(var(--c-surface-raised) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          soft: "rgb(var(--c-ink-soft) / <alpha-value>)",
          faint: "rgb(var(--c-ink-faint) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--c-line) / <alpha-value>)",
          soft: "rgb(var(--c-line-soft) / <alpha-value>)",
        },
        signal: {
          50: "rgb(var(--c-signal-50) / <alpha-value>)",
          100: "rgb(var(--c-signal-100) / <alpha-value>)",
          300: "rgb(var(--c-signal-300) / <alpha-value>)",
          400: "rgb(var(--c-signal-400) / <alpha-value>)",
          500: "rgb(var(--c-signal-500) / <alpha-value>)", // primary accent
          600: "rgb(var(--c-signal-600) / <alpha-value>)",
          700: "rgb(var(--c-signal-700) / <alpha-value>)",
          900: "rgb(var(--c-signal-900) / <alpha-value>)",
        },
        // Foreground for content on a signal-500/600/700 fill. Use
        // `text-onSignal` instead of `text-white` there: signal-500 is deep
        // navy in light but warm white in dark, so a hardcoded white
        // foreground disappears in dark mode.
        onSignal: "rgb(var(--c-on-signal) / <alpha-value>)",
        amber: {
          100: "rgb(var(--c-amber-100) / <alpha-value>)",
          500: "rgb(var(--c-amber-500) / <alpha-value>)",
          700: "rgb(var(--c-amber-700) / <alpha-value>)",
        },
        rose: {
          100: "rgb(var(--c-rose-100) / <alpha-value>)",
          500: "rgb(var(--c-rose-500) / <alpha-value>)",
          700: "rgb(var(--c-rose-700) / <alpha-value>)",
        },
        moss: {
          100: "rgb(var(--c-moss-100) / <alpha-value>)",
          500: "rgb(var(--c-moss-500) / <alpha-value>)",
          700: "rgb(var(--c-moss-700) / <alpha-value>)",
        },

        // Shadcn-style semantic token aliases — resolve to the same RIVA
        // variables so both naming conventions (`bg-primary`, `bg-signal-500`)
        // work and automatically theme correctly in light/dark.
        primary: { DEFAULT: "rgb(var(--c-signal-500) / <alpha-value>)", foreground: "rgb(var(--c-on-signal) / <alpha-value>)" },
        secondary: { DEFAULT: "rgb(var(--c-surface) / <alpha-value>)", foreground: "rgb(var(--c-ink) / <alpha-value>)" },
        muted: { DEFAULT: "rgb(var(--c-surface-muted) / <alpha-value>)", foreground: "rgb(var(--c-ink-faint) / <alpha-value>)" },
        accent: { DEFAULT: "rgb(var(--c-surface-muted) / <alpha-value>)", foreground: "rgb(var(--c-ink) / <alpha-value>)" },
        destructive: { DEFAULT: "rgb(var(--c-rose-500) / <alpha-value>)", foreground: "rgb(var(--c-on-signal) / <alpha-value>)" },
        border: "rgb(var(--c-line) / <alpha-value>)",
        input: "rgb(var(--c-line) / <alpha-value>)",
        ring: "rgb(var(--c-signal-500) / <alpha-value>)",
        popover: { DEFAULT: "rgb(var(--c-surface-raised) / <alpha-value>)", foreground: "rgb(var(--c-ink) / <alpha-value>)" },
        background: "rgb(var(--c-paper) / <alpha-value>)",
        foreground: "rgb(var(--c-ink) / <alpha-value>)",
        card: { DEFAULT: "rgb(var(--c-surface) / <alpha-value>)", foreground: "rgb(var(--c-ink) / <alpha-value>)" },
        chart: {
          1: "rgb(var(--c-chart-1) / <alpha-value>)",
          2: "rgb(var(--c-chart-2) / <alpha-value>)",
          3: "rgb(var(--c-chart-3) / <alpha-value>)",
          4: "rgb(var(--c-chart-4) / <alpha-value>)",
          5: "rgb(var(--c-chart-5) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)",
          foreground: "rgb(var(--c-ink) / <alpha-value>)",
          primary: { DEFAULT: "rgb(var(--c-signal-500) / <alpha-value>)", foreground: "rgb(var(--c-on-signal) / <alpha-value>)" },
          accent: { DEFAULT: "rgb(var(--c-surface-muted) / <alpha-value>)", foreground: "rgb(var(--c-ink) / <alpha-value>)" },
          border: "rgb(var(--c-line) / <alpha-value>)",
          ring: "rgb(var(--c-signal-500) / <alpha-value>)",
        },

        // RIVA Web (Liquid Glass) — fixed brand colors for the glass layer only.
        // These deliberately do NOT swap under `.dark`: the glass surface is a
        // translucent branded panel whose own text inverts for legibility, so it
        // must stay constant. Kept separate so the core design tokens stay pure.
        "warm-white": "#F7F7F3",
        "deep-navy": "#101C2C",
        "deep-ink": "#10131A",
        "steel-blue": "#71879B",
      },
      fontFamily: {
        // These resolve through --font-ui / --font-ui-display, which
        // globals.css swaps based on html[data-locale] — so `font-sans`
        // and `font-display` always match the active language, wherever
        // they're used, instead of hardcoding Vazirmatn everywhere (which
        // both fought English typography and left mono/number contexts
        // without a Persian fallback).
        sans: ["var(--font-ui)", "system-ui", "sans-serif"],
        display: ["var(--font-ui-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "var(--font-ui)", "ui-monospace", "SFMono-Regular", "monospace"],
        fa: ["var(--font-vazirmatn)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "28px",
        "3xl": "32px",
        "4xl": "9999px",
      },
      boxShadow: {
        // Tinted with RIVA Deep Navy rather than neutral black — a cool
        // shadow over warm-white paper keeps elevation from muddying.
        subtle: "0 1px 2px rgba(16, 28, 44, 0.04), 0 1px 1px rgba(16, 28, 44, 0.03)",
        card: "0 1px 2px rgba(16, 28, 44, 0.05), 0 8px 24px -12px rgba(16, 28, 44, 0.10)",
        raised: "0 12px 32px -16px rgba(16, 28, 44, 0.20)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-dot": {
          "0%, 80%, 100%": { opacity: "0.25" },
          "40%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 260ms cubic-bezier(0.16,1,0.3,1) both",
        "pop-in": "pop-in 200ms cubic-bezier(0.16,1,0.3,1) both",
        "pulse-dot": "pulse-dot 1.2s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        "accordion-down": "accordion-down 200ms cubic-bezier(0.16,1,0.3,1)",
        "accordion-up": "accordion-up 200ms cubic-bezier(0.16,1,0.3,1)",
        marquee: "marquee 40s linear infinite",
      },
      maxWidth: {
        content: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
