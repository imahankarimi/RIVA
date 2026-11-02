/**
 * RIVA DESIGN SYSTEM — Liquid Glass tokens
 * ===========================================================================
 * Shared by RIVA Main (`frontend/`) and RIVA Web (`webapp/`).
 *
 * WHY THIS EXISTS
 * ---------------
 * Liquid Glass is RIVA's one indulgence, and it is a *navigation* material
 * only. It is what makes the mobile experience feel like a native app: a
 * floating, blurred, specular navigation bar that content scrolls underneath,
 * instead of a static strip bolted to the bottom of the page.
 *
 * The rules that keep it tasteful:
 *   1. NAVIGATION ONLY. Cards, tables, forms and money surfaces stay opaque
 *      and crisp. Glass on content surfaces is how a UI starts looking cheap.
 *   2. ONE MATERIAL. Topbar and nav share the same recipe so the app reads as
 *      a single physical system rather than two components that happen to blur.
 *   3. IT DOES NOT INVERT. Under `.dark` only the *tint* changes. Blur,
 *      translucency and border strength are properties of the material, not of
 *      the theme, so they stay constant (see `--glass-*` in tokens.css).
 *   4. IT CARRIES ITS OWN TEXT. Because the fill is a fixed brand material,
 *      content on it uses the fixed `deep-ink` / `warm-white` constants rather
 *      than the theme-dependent `ink` / `onSignal` tokens.
 *
 * SPECULAR GLOW
 * -------------
 * A soft radial highlight along the top edge, standing in for the way light
 * catches a curved glass edge. It is the detail that separates "blurred
 * rectangle" from "glass". Keep it subtle: 45% white in light, 15% warm white
 * in dark. Anything stronger reads as a plastic button.
 *
 * HOW TO USE
 * ----------
 *   import { GLASS } from "@/components/webapp/glass";   // webapp
 *   import { GLASS } from "@/components/layout/glass";   // frontend
 *
 *   <div className={cn("relative rounded-3xl", GLASS.nav, GLASS.glow)} />
 *
 * Notes:
 *   - These are multi-line template-literal class strings passed through `cn()`.
 *     They work because Tailwind's JIT scans the source text, so these exact
 *     class names must remain literal here — do not build them dynamically.
 *   - `GLASS.base` is the default surface (used by the mobile tab bar and the
 *     More sheet). `GLASS.light.*` is the explicit light-first variant used by
 *     the desktop bars; `GLASS.glow` is the matching specular highlight.
 */

/** Soft refraction/lensing highlight along the top edge. */
const SPECULAR_GLOW = `
  after:pointer-events-none after:absolute after:inset-0
  after:rounded-[inherit]
  after:bg-[radial-gradient(120%_50%_at_50%_-30%,rgba(255,255,255,0.45),transparent_65%)]
  after:content-['']
`;

/** Dark-mode specular: the same highlight, warmed and heavily reduced. */
const SPECULAR_GLOW_DARK = `
  after:pointer-events-none after:absolute after:inset-0
  after:rounded-[inherit]
  after:bg-[radial-gradient(120%_50%_at_50%_-30%,rgba(247,247,243,0.15),transparent_65%)]
  after:content-['']
`;

export const GLASS = {
  /** Light mode: the premium baseline for navigation surfaces. */
  light: {
    /** Floating top bar (desktop) and the mobile top bar. */
    topbar: `
      border border-white/50
      bg-white/[0.68]
      text-deep-ink
      shadow-[0_12px_32px_-8px_rgba(16,28,44,0.18)]
      backdrop-blur-[18px]
      dark:border-white/10
      dark:bg-surface/[0.55]
      dark:text-ink
      dark:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)]
    `,
    /** The floating bottom tab bar and the More sheet. */
    nav: `
      border border-white/50
      bg-white/[0.65]
      text-deep-ink
      shadow-[0_16px_40px_-12px_rgba(16,28,44,0.22)]
      backdrop-blur-[20px]
      dark:border-white/10
      dark:bg-surface/[0.52]
      dark:text-ink
      dark:shadow-[0_12px_32px_-10px_rgba(0,0,0,0.45)]
    `,
    glow: SPECULAR_GLOW,
  },

  dark: {
    topbar: `
      border border-white/10
      bg-surface/[0.55]
      text-ink
      shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)]
      backdrop-blur-[18px]
    `,
    nav: `
      border border-white/10
      bg-surface/[0.52]
      text-ink
      shadow-[0_12px_32px_-10px_rgba(0,0,0,0.45)]
      backdrop-blur-[20px]
    `,
    glow: SPECULAR_GLOW_DARK,
  },

  /**
   * The default surface: theme-aware in one string, used by the mobile tab bar
   * and the More sheet. Prefer this unless you specifically need the
   * light-first variant.
   */
  base: `
    border border-white/50
    bg-white/[0.68]
    text-deep-ink
    shadow-[0_12px_32px_-8px_rgba(16,28,44,0.18)]
    backdrop-blur-[18px]
    dark:border-white/10
    dark:bg-surface/[0.55]
    dark:text-ink
    dark:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)]
  `,
  glow: SPECULAR_GLOW,
} as const;

export default GLASS;