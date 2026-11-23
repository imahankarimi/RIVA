/**
 * Cross-application theme transfer.
 *
 * RIVA Main and RIVA Web run on different origins, so their localStorage is
 * not shared. A one-shot `?theme=light|dark` query parameter carries the
 * visitor's active theme from RIVA Main to RIVA Web. It is validated on
 * arrival, written by the receiving ThemeProvider, and then removed. RIVA Web
 * has no reverse link or reverse theme parameter.
 */

export const THEME_STORAGE_KEY = "ledgerai.theme";

export type ThemeMode = "light" | "dark";

/** Strict validation: only the two values the theme system can apply. */
export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

/** Read the one-shot `theme` parameter, ignoring anything invalid. */
export function readThemeParam(search: string): ThemeMode | null {
  const value = new URLSearchParams(search).get("theme");
  return isThemeMode(value) ? value : null;
}

/**
 * Append the active theme to a landing-page URL. Returns the original URL
 * unchanged if it cannot be parsed, so a bad environment value never produces
 * a broken redirect.
 */
export function withThemeParam(baseUrl: string, theme: ThemeMode): string {
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return baseUrl;
    url.searchParams.set("theme", theme);
    return url.toString();
  } catch {
    return baseUrl;
  }
}

/**
 * Remove the theme parameter after it has been applied. Uses History API
 * replacement (not a router navigation) so there is no reload or redirect
 * loop. Other query parameters and the hash are preserved.
 */
export function clearThemeParam(): void {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("theme")) return;

    url.searchParams.delete("theme");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  } catch {
    // A sandboxed browser may block History API updates; the applied theme
    // and the persisted preference are still correct.
  }
}
