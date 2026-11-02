const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL && typeof window !== "undefined") {
  // Fail loudly in dev rather than silently hitting the wrong host.
  // eslint-disable-next-line no-console
  console.warn(
    "NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and point it at your FastAPI backend."
  );
}

/** Every business-scoped endpoint requires auth. Keeping the token here (instead of
 *  threading it through every hook/call site) means a live backend actually gets
 *  authenticated requests instead of silently 401'ing and falling back to demo data. */
export const TOKEN_STORAGE_KEY = "ledgerai.access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "ledgerai.refresh_token";

export function getStoredToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? undefined;
}

export function setStoredToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) ?? undefined;
}

export function setStoredRefreshToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredRefreshToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  token?: string;
  /** Internal: marks the single automatic refresh-retry so it never loops. */
  _retried?: boolean;
}

/** Default request timeout (ms). Matches the backend's per-endpoint timeouts so
 *  a hung/slow server fails fast on the client instead of leaving the fetch
 *  (and the browser tab's connection) open indefinitely. */
export const DEFAULT_TIMEOUT_MS = 60_000;

/** Endpoints where a 401 is an answer, not an expired token (never auto-refreshed). */
const NO_REFRESH_PATHS = new Set(["/api/auth/login", "/api/auth/signup", "/api/auth/refresh"]);

/** Concurrent 401s must share ONE refresh call: a second exchange with the
 *  same (already rotated) refresh token would be rejected as replay and
 *  revoke the whole session server-side. */
let refreshInFlight: Promise<boolean> | null = null;

/** Exchange the stored refresh token for a new access + refresh pair.
 *  Returns false when there is no refresh token or the exchange fails
 *  (expired/revoked/replayed) — the caller then clears auth state.
 *  Never throws; never recurses into apiRequest. */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performTokenRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performTokenRefresh(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL ?? ""}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Deliberately NO Authorization header: refresh must work with an
      // expired access token, and refresh tokens are never API credentials.
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.access_token || !data?.refresh_token) return false;
    setStoredToken(data.access_token);
    setStoredRefreshToken(data.refresh_token);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const base = API_URL ?? "";
  const token = options.token ?? getStoredToken();

  // Apply a default timeout unless the caller supplied its own signal, so a
  // hung server fails fast instead of leaving the fetch open indefinitely.
  // `AbortSignal.timeout` (newer browsers) is preferred; fall back to a manual
  // controller for older runtimes.
  const controller = options.signal ? null : new AbortController();
  const signal = options.signal ?? controller!.signal;
  const timeoutId = controller == null
    ? undefined
    : setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${base}${path}`, {
      method: options.method ?? "GET",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal,
    });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const data = await res.json();
        detail = data?.detail ?? data?.message ?? detail;
      } catch {
        // response wasn't JSON — keep statusText
      }

      // One transparent refresh-and-retry on 401 (expired access token).
      // Bounded: at most one retry per request, auth endpoints excluded,
      // and a failed refresh clears local auth state instead of looping.
      if (res.status === 401 && !options._retried && !NO_REFRESH_PATHS.has(path)) {
        if (await refreshSession()) {
          return apiRequest<T>(path, { ...options, token: undefined, _retried: true });
        }
        clearStoredToken();
        clearStoredRefreshToken();
      }
      throw new ApiError(detail, res.status);
    }

    // Some endpoints (e.g. successful DELETE) may return no body.
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (err) {
    // Distinguish a default-timeout abort from a genuine failure so callers can
    // show "timed out" rather than a generic network error.
    if (controller != null && err instanceof Error && err.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }
    throw err;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}
