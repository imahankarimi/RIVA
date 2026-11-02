import type { Config } from "tailwindcss";
import { rivaPreset } from "../design-system/tailwind-preset";

/**
 * RIVA Main — Tailwind config.
 *
 * The entire theme comes from the shared RIVA design system at
 * `design-system/tailwind-preset.ts`, which in turn resolves every colour
 * through CSS custom properties declared in `design-system/tokens.css`
 * (imported by `app/globals.css`).
 *
 * To change the design system, edit `design-system/` — NOT this file and NOT
 * `webapp/tailwind.config.ts`, which consume the same preset. Keeping the two
 * apps on one preset is what stops RIVA Main and RIVA Web from drifting.
 *
 * See `docs/DESIGN_SYSTEM.md` and `AGENT.md`.
 */
const config: Config = {
  // `content` is the only app-specific part: it must stay relative to THIS
  // directory so Tailwind can find this app's classes.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  presets: [rivaPreset],
  plugins: [],
};

export default config;