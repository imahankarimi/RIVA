/**
 * RIVA DESIGN SYSTEM — design-system/tailwind-preset.ts
 * ===========================================================================
 * The single source of truth for the Tailwind theme. Both `frontend/` (RIVA
 * Main) and `webapp/` (RIVA Web) spread this preset in their
 * `tailwind.config.ts`, which is why a token added here appears in both apps.
 *
 * Every colour resolves through a CSS custom property defined in
 * `design-system/tokens.css`, which each app imports from its `app/globals.css`.
 * That indirection is what lets one class (`bg-paper`, `text-ink`,
 * `bg-signal-500`) theme correctly in light and dark with no per-component
 * `dark:` variant.
 *
 * When adding a token:
 *   1. Declare it in `design-system/tokens.css` for BOTH `:root` and `.dark`.
 *   2. Expose it here.
 *   3. Add it to `docs/DESIGN_SYSTEM.md`.
 *   4. Verify with `npm run build` in both apps.
 *
 * See `docs/DESIGN_SYSTEM.md` for the rationale behind every value and
 * `AGENT.md` for the rules an agent must follow when building RIVA UI.
 *
 * NOTE ON TYPES: this file deliberately does NOT `import type { Config } from
 * "tailwindcss"`. It sits at the repository root, outside both Next.js apps, so
 * Node resolution from this directory cannot reach either app's
 * `node_modules`. A local structural type keeps the file dependency-free and
 * therefore usable from both build roots.
 */
type PresetShape = {
  darkMode: "class";
  theme: { extend: Record<string, unknown> };
};
export const rivaPreset = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- RIVA foundation -----------------------------------------------
        // Warm White paper, Deep Navy primary, Deep Ink text, Steel hairlines.
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
        // `text-onSignal` rather than `text-white` there: signal-500 is deep
        // navy in light but warm white in dark, so a hardcoded white
        // foreground vanishes in dark mode.
        onSignal: "rgb(var(--c-on-signal) / <alpha-value>)",

        // --- Status ramp ----------------------------------------------------
        // The only place rose / amber / moss are allowed to appear.
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

        // --- Semantic layer --------------------------------------------------
        // Preferred over the foundation ramp for all NEW UI: these name a
        // meaning rather than a pigment, so re-theming never touches a
        // component. Foundation tokens above remain supported for existing
        // code and are not deprecated.
        // `background` (below) is the Tailwind name for the page background;
        // the foundation alias for it is `paper`. There is deliberately no
        // `bg` key — `bg-bg` is not a name worth having in the system.
        //
        // `surface-1/2/3` form the numbered elevation scale:
        //   sunken < paper < surface-1 < surface-2 < surface-3 < overlay
        // `surfaceMuted` / `surfaceRaised` above are the older names for the
        // same two steps and remain supported; prefer the numbered form in
        // new code so the ramp reads as a single ordered scale.
        surfaceSunken: "rgb(var(--c-surface-sunken) / <alpha-value>)",
        surfaceInset: "rgb(var(--c-surface-2) / <alpha-value>)",
        scrim: "rgb(var(--c-overlay-scrim) / <alpha-value>)",

        text: {
          DEFAULT: "rgb(var(--c-text) / <alpha-value>)",
          soft: "rgb(var(--c-text-soft) / <alpha-value>)",
          faint: "rgb(var(--c-text-faint) / <alpha-value>)",
          inverse: "rgb(var(--c-text-inverse) / <alpha-value>)",
        },

        border: {
          DEFAULT: "rgb(var(--c-border) / <alpha-value>)",
          subtle: "rgb(var(--c-border-subtle) / <alpha-value>)",
          strong: "rgb(var(--c-border-strong) / <alpha-value>)",
        },

        primary: {
          DEFAULT: "rgb(var(--c-primary) / <alpha-value>)",
          hover: "rgb(var(--c-primary-hover) / <alpha-value>)",
          active: "rgb(var(--c-primary-active) / <alpha-value>)",
          foreground: "rgb(var(--c-primary-fg) / <alpha-value>)",
          soft: "rgb(var(--c-primary-soft) / <alpha-value>)",
          "soft-foreground": "rgb(var(--c-primary-soft-fg) / <alpha-value>)",
        },

        // RIVA has one accent and it is the brand navy. "Accent" means
        // emphasis on a neutral surface, never a second brand colour.
        accent: {
          DEFAULT: "rgb(var(--c-accent) / <alpha-value>)",
          foreground: "rgb(var(--c-accent-fg) / <alpha-value>)",
        },

        success: {
          DEFAULT: "rgb(var(--c-success) / <alpha-value>)",
          fill: "rgb(var(--c-success-fill) / <alpha-value>)",
          surface: "rgb(var(--c-success-surface) / <alpha-value>)",
          foreground: "rgb(var(--c-success-fg) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--c-warning) / <alpha-value>)",
          fill: "rgb(var(--c-warning-fill) / <alpha-value>)",
          surface: "rgb(var(--c-warning-surface) / <alpha-value>)",
          foreground: "rgb(var(--c-warning-fg) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--c-danger) / <alpha-value>)",
          fill: "rgb(var(--c-danger-fill) / <alpha-value>)",
          surface: "rgb(var(--c-danger-surface) / <alpha-value>)",
          foreground: "rgb(var(--c-danger-fg) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--c-info) / <alpha-value>)",
          fill: "rgb(var(--c-info-fill) / <alpha-value>)",
          surface: "rgb(var(--c-info-surface) / <alpha-value>)",
          foreground: "rgb(var(--c-info-fg) / <alpha-value>)",
        },

        // --- Financial semantics --------------------------------------------
        // Financial colour is meaning. Use these — never moss/rose directly —
        // on any surface that reports money, so a rising expense can be
        // coloured independently of its sign (see StatCard invertTrendColor).
        fin: {
          positive: "rgb(var(--c-fin-positive) / <alpha-value>)",
          "positive-fill": "rgb(var(--c-fin-positive-fill) / <alpha-value>)",
          "positive-surface": "rgb(var(--c-fin-positive-surface) / <alpha-value>)",
          negative: "rgb(var(--c-fin-negative) / <alpha-value>)",
          "negative-fill": "rgb(var(--c-fin-negative-fill) / <alpha-value>)",
          "negative-surface": "rgb(var(--c-fin-negative-surface) / <alpha-value>)",
          caution: "rgb(var(--c-fin-caution) / <alpha-value>)",
          "caution-fill": "rgb(var(--c-fin-caution-fill) / <alpha-value>)",
          "caution-surface": "rgb(var(--c-fin-caution-surface) / <alpha-value>)",
          neutral: "rgb(var(--c-fin-neutral) / <alpha-value>)",
          revenue: "rgb(var(--c-fin-revenue) / <alpha-value>)",
          expense: "rgb(var(--c-fin-expense) / <alpha-value>)",
          cash: "rgb(var(--c-fin-cash) / <alpha-value>)",
          debt: "rgb(var(--c-fin-debt) / <alpha-value>)",
        },

        // --- RIVA Advisor -----------------------------------------------------
        // RIVA's own voice, ranked by severity. Never a purple/cyan "AI"
        // gradient: Advisor chrome is the brand navy and it borrows the status
        // ramp only to rank how much something matters.
        advisor: {
          insight: "rgb(var(--c-advisor-insight) / <alpha-value>)",
          "insight-surface": "rgb(var(--c-advisor-insight-surface) / <alpha-value>)",
          "insight-fg": "rgb(var(--c-advisor-insight-fg) / <alpha-value>)",
          recommendation: "rgb(var(--c-advisor-recommendation) / <alpha-value>)",
          "recommendation-surface": "rgb(var(--c-advisor-recommendation-surface) / <alpha-value>)",
          forecast: "rgb(var(--c-advisor-forecast) / <alpha-value>)",
          "forecast-surface": "rgb(var(--c-advisor-forecast-surface) / <alpha-value>)",
          risk: "rgb(var(--c-advisor-risk) / <alpha-value>)",
          "risk-surface": "rgb(var(--c-advisor-risk-surface) / <alpha-value>)",
          critical: "rgb(var(--c-advisor-critical) / <alpha-value>)",
          "critical-surface": "rgb(var(--c-advisor-critical-surface) / <alpha-value>)",
        },

        // --- Shadcn-compatible aliases ----------------------------------------
        // Resolve to the same RIVA variables so both naming conventions work
        // (`bg-primary` and `bg-signal-500`) and both theme automatically.
        // NOTE: `secondary`, `muted`, `accent`, `destructive` and the
        // sidebar group are kept pointing at their historical variables
        // (rather than the newer semantic ones) so that every existing
        // component renders byte-identically. They are aliases, not a second
        // source of truth — change the variable, not the component.
        secondary: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)",
          foreground: "rgb(var(--c-text) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--c-surface-muted) / <alpha-value>)",
          foreground: "rgb(var(--c-text-faint) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--c-danger-fill) / <alpha-value>)",
          foreground: "rgb(var(--c-danger-fg) / <alpha-value>)",
        },
        input: "rgb(var(--c-border) / <alpha-value>)",
        ring: "rgb(var(--c-ring) / <alpha-value>)",
        popover: {
          DEFAULT: "rgb(var(--c-surface-3) / <alpha-value>)",
          foreground: "rgb(var(--c-text) / <alpha-value>)",
        },
        background: "rgb(var(--c-bg) / <alpha-value>)",
        foreground: "rgb(var(--c-text) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--c-surface-1) / <alpha-value>)",
          foreground: "rgb(var(--c-text) / <alpha-value>)",
        },
        chart: {
          1: "rgb(var(--c-chart-1) / <alpha-value>)",
          2: "rgb(var(--c-chart-2) / <alpha-value>)",
          3: "rgb(var(--c-chart-3) / <alpha-value>)",
          4: "rgb(var(--c-chart-4) / <alpha-value>)",
          5: "rgb(var(--c-chart-5) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)",
          foreground: "rgb(var(--c-text) / <alpha-value>)",
          primary: {
            DEFAULT: "rgb(var(--c-signal-500) / <alpha-value>)",
            foreground: "rgb(var(--c-on-signal) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "rgb(var(--c-surface-muted) / <alpha-value>)",
            foreground: "rgb(var(--c-text) / <alpha-value>)",
          },
          border: "rgb(var(--c-line) / <alpha-value>)",
          ring: "rgb(var(--c-ring) / <alpha-value>)",
        },

        // --- Liquid-glass brand constants --------------------------------------
        // FIXED values for the glass layer only. These deliberately do NOT swap
        // under `.dark`: a glass surface is a translucent branded panel whose
        // own text inverts for legibility, so the material stays constant.
        // Kept separate so the core design tokens stay pure.
        "warm-white": "#F7F7F3",
        "deep-navy": "#101C2C",
        "deep-ink": "#10131A",
        "steel-blue": "#71879B",
      },

      fontFamily: {
        // Use the actual Next.js font loader variables directly.
        // English uses IBM Plex Sans for UI, Manrope for display.
        // Persian uses Vazirmatn for both.
        sans: ["var(--font-ibm-plex-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-ibm-plex-sans)", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "var(--font-ibm-plex-sans)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        fa: ["var(--font-vazirmatn)", "system-ui", "sans-serif"],
      },

      borderRadius: {
        xs: "var(--r-xs)",
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
        "2xl": "var(--r-2xl)",
        pill: "var(--r-pill)",
        // Kept for existing `rounded-3xl` call sites (floating nav, sheets).
        "3xl": "32px",
        "4xl": "9999px",
      },

      boxShadow: {
        subtle: "var(--shadow-subtle)",
        card: "var(--shadow-card)",
        raised: "var(--shadow-raised)",
        nav: "var(--shadow-nav)",
        float: "var(--shadow-float)",
      },

      transitionTimingFunction: {
        riva: "cubic-bezier(0.16, 1, 0.3, 1)",
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        moderate: "240ms",
        slow: "320ms",
      },

      spacing: {
        gutter: "var(--gutter)",
        "section-gap": "var(--section-gap)",
        "touch-min": "var(--touch-min)",
        topbar: "var(--topbar-h)",
        "sidebar-w": "var(--sidebar-w)",
        "nav-h": "var(--mobile-nav-h)",
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
        "fade-up": "fade-up var(--dur-moderate) cubic-bezier(0.16,1,0.3,1) both",
        "pop-in": "pop-in var(--dur-base) cubic-bezier(0.16,1,0.3,1) both",
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
} satisfies PresetShape;

export default rivaPreset;