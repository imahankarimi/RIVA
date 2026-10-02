import { useTheme } from "@/lib/theme/ThemeProvider";

// Every chart in Reports pulls its colors from here so nothing introduces
// an ad-hoc hue outside the existing design system (see tailwind.config.ts
// / app/globals.css design tokens). Recharts renders raw SVG attributes,
// which can't resolve CSS custom properties the way Tailwind classes can,
// so light/dark are two explicit palettes picked at render time. Values
// below are kept in sync with the RGB triplets in app/globals.css.
//
// Semantics, not brand color, drive revenue/expense hues: revenue and
// positive cash flow use moss (the same "positive" green used by
// StatCard/Badge elsewhere in the app), expenses and negative cash flow
// use rose. The brand navy/white ("primary") is reserved for neutral,
// non-polarized chart elements — it doesn't mean "good" or "bad".

const LIGHT = {
  primary: "#101C2C", // signal-500 (Deep Navy) — neutral brand accent
  revenue: "#3E9A6D", // moss-500 — positive / revenue
  expenses: "#B5433A", // rose-500 — negative / expenses
  cashFlowPositive: "#3E9A6D",
  cashFlowNegative: "#B5433A",
  grid: "rgba(113, 135, 155, 0.18)", // line, dimmed for a quiet grid
  axis: "#71879B", // ink-faint
  ink: "#10131A", // ink (full-emphasis labels, e.g. category names)
  cursor: "rgba(16, 19, 26, 0.03)",
  category: ["#101C2C", "#71879B", "#3E9A6D", "#C68A2E", "#B5433A", "#607D94"],
};

const DARK = {
  primary: "#F7F7F3", // signal-500 (Warm White) — neutral brand accent
  revenue: "#58B585", // moss-500 (dark) — positive / revenue
  expenses: "#C55048", // rose-500 (dark) — negative / expenses
  cashFlowPositive: "#58B585",
  cashFlowNegative: "#C55048",
  grid: "rgba(113, 135, 155, 0.25)",
  axis: "#91A2B1", // ink-faint (dark)
  ink: "#F7F7F3", // ink (dark)
  cursor: "rgba(247, 247, 243, 0.05)",
  category: ["#F7F7F3", "#71879B", "#58B585", "#D9A04C", "#C55048", "#91A2B1"],
};

export type ChartPalette = typeof LIGHT;

/** Use inside client chart components to get the palette for the active theme. */
export function useChartColors(): ChartPalette {
  const { resolved } = useTheme();
  return resolved === "dark" ? DARK : LIGHT;
}

/** Static fallback for non-component contexts (kept for compatibility). */
export const CHART_COLORS = LIGHT;
export const CATEGORY_COLOR_CYCLE = LIGHT.category;
