/**
 * Account-scoped client storage.
 *
 * RIVA keeps tokens in localStorage, so a signed-out or expired session must
 * not leave private artefacts behind for the next person who opens the app on
 * this device. Public preferences (theme, locale, AI display prefs) are
 * intentionally preserved.
 */

const PRIVATE_STORAGE_PREFIXES = [
  "ledgerai.chat_history",
  "riva.active_conversation.",
];

const PRIVATE_STORAGE_KEYS = [
  "ledgerai.access_token",
  "ledgerai.refresh_token",
];

/** Remove every account-specific artefact from localStorage. Best-effort:
 *  storage may be unavailable in private browsing or embedded webviews. */
export function purgePrivateClientData() {
  if (typeof window === "undefined") return;

  try {
    for (const key of PRIVATE_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }

    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (PRIVATE_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable — there is nothing durable to clean up.
  }

  try {
    window.sessionStorage.removeItem("riva.preview.returnTo");
    window.sessionStorage.removeItem("riva.preview.intent");
  } catch {
    // ignore
  }
}
