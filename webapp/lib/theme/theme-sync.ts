/**
 * Cross-application theme transfer (one-way).
 *
 * RIVA Main links to this landing page with a one-shot `?theme=light|dark`
 * parameter, because the two sites are separate origins and do not share
 * localStorage. The value is validated, applied by the pre-paint bootstrap
 * script and ThemeProvider, and then removed from the URL. RIVA Web does not
 * carry a link or a theme parameter back to RIVA Main.
 */

export const THEME_STORAGE_KEY = "ledgerai.theme";

/** Strict validation: only the two values the theme system can apply. */
function isThemeMode(value: string | null | undefined): value is "light" | "dark" {
  return value === "light" || value === "dark";
}

/** Read the one-shot `theme` parameter, ignoring anything invalid. */
export function readThemeParam(search: string): "light" | "dark" | null {
  const value = new URLSearchParams(search).get("theme");
  return isThemeMode(value) ? value : null;
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
