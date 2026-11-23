import { type ThemeMode, withThemeParam } from "@/lib/theme/theme-sync";

/**
 * RIVA Web landing page. Overridable per deployment; the documented
 * production origin is the safe fallback so the cross-app CTA never silently
 * disappears when the environment variable is absent or malformed.
 */
const DEFAULT_RIVA_WEBAPP_URL = "https://riva-app-inky.vercel.app/";

function resolveRivaWebappUrl(): string {
  const configured = process.env.NEXT_PUBLIC_RIVA_WEBAPP_URL?.trim();
  if (!configured) return DEFAULT_RIVA_WEBAPP_URL;

  try {
    const url = new URL(configured);
    return url.protocol === "http:" || url.protocol === "https:"
      ? configured
      : DEFAULT_RIVA_WEBAPP_URL;
  } catch {
    return DEFAULT_RIVA_WEBAPP_URL;
  }
}

const RIVA_WEBAPP_URL = resolveRivaWebappUrl();

/** RIVA Web landing page with the visitor's active theme attached. */
export function rivaWebappUrl(theme: ThemeMode): string {
  return withThemeParam(RIVA_WEBAPP_URL, theme);
}
