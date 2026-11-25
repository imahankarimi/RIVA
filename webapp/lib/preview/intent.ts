/**
 * Guest → authenticated hand-off.
 *
 * When a guest asks for a protected operation we remember *where* they were
 * and *what* they intended, so authentication is a continuation of their work
 * rather than a dead end. Nothing is executed automatically: the remembered
 * intent only re-opens the relevant form after sign-in.
 */

export type PreviewIntentKind =
  | "add-transaction"
  | "import"
  | "export"
  | "assistant"
  | "settings"
  | "general";

export interface PreviewIntent {
  kind: PreviewIntentKind;
  /** Human-readable i18n key for the prompt that triggered this intent. */
  reasonKey?: string;
}

const RETURN_TO_KEY = "riva.preview.returnTo";
const INTENT_KEY = "riva.preview.intent";

/** Only same-origin app paths are accepted, so a crafted query value can never
 *  turn the post-login redirect into an open redirect. */
export function isSafeInternalPath(path: string | null | undefined): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export function savePreviewReturnTo(path: string) {
  if (typeof window === "undefined" || !isSafeInternalPath(path)) return;
  try {
    window.sessionStorage.setItem(RETURN_TO_KEY, path);
  } catch {
    // ignore
  }
}

export function readPreviewReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(RETURN_TO_KEY);
    return isSafeInternalPath(value) ? value : null;
  } catch {
    return null;
  }
}

export function clearPreviewReturnTo() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(RETURN_TO_KEY);
  } catch {
    // ignore
  }
}

export function savePreviewIntent(intent: PreviewIntent | null) {
  if (typeof window === "undefined") return;
  try {
    if (intent) window.sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent));
    else window.sessionStorage.removeItem(INTENT_KEY);
  } catch {
    // ignore
  }
}

export function readPreviewIntent(): PreviewIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PreviewIntent>;
    if (!parsed || typeof parsed.kind !== "string") return null;
    return { kind: parsed.kind as PreviewIntentKind, reasonKey: parsed.reasonKey };
  } catch {
    return null;
  }
}
