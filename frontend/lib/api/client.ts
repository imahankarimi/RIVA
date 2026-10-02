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
}

/** Default request timeout (ms). Matches the backend's per-endpoint timeouts so
 *  a hung/slow server fails fast on the client instead of leaving the fetch
 *  (and the browser tab's connection) open indefinitely. */
export const DEFAULT_TIMEOUT_MS = 60_000;

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
