import type { Config } from "tailwindcss";
import { rivaPreset } from "../design-system/tailwind-preset";

/**
 * RIVA Web — Tailwind config.
 *
 * Identical to RIVA Main's theme: both consume the shared RIVA design system
 * at `design-system/tailwind-preset.ts`, which resolves every colour through
 * CSS custom properties declared in `design-system/tokens.css` (imported by
 * `app/globals.css`).
 *
 * `content` is the only app-specific part and must stay relative to THIS
 * directory. The Liquid Glass navigation layer (floating mobile tab bar,
 * glass top bars) is expressed with the preset's fixed brand constants
 * (`warm-white`, `deep-navy`, `deep-ink`, `steel-blue`) plus
 * `components/webapp/glass.ts` — never with ad-hoc Tailwind opacity values.
 *
 * See `docs/DESIGN_SYSTEM.md` and `AGENT.md`.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  presets: [rivaPreset],
  plugins: [],
};

export default config;