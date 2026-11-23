"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  THEME_STORAGE_KEY,
  clearThemeParam,
  readThemeParam,
} from "@/lib/theme/theme-sync";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  /** What the user picked: "light" | "dark" | "system". */
  preference: ThemePreference;
  /** What's actually applied right now (system resolved to light/dark). */
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
  /** Convenience: cycles light -> dark -> system -> light. */
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initial value is read synchronously from the DOM class the inline
  // bootstrap script (see app/layout.tsx) already set before hydration,
  // so there is no light->dark flash and no hydration mismatch.
  const [preference, setPreferenceState] = useState<ThemePreference>("dark");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    // A valid `?theme=` parameter is a one-shot transfer from the other RIVA
    // site. It wins over the stored preference, is persisted through the same
    // key the provider already owns, and is then removed from the URL.
    const incoming = readThemeParam(window.location.search);
    if (incoming) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, incoming);
      } catch {
        // Storage can be unavailable; the theme still applies for this page.
      }
    }

    let stored: ThemePreference | null = incoming;
    if (!stored) {
      try {
        stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
      } catch {
        stored = null;
      }
    }
    stored ??= "dark";
    setPreferenceState(stored);
    const next = stored === "system" ? getSystemTheme() : stored;
    setResolved(next);
    applyTheme(next);

    if (incoming) clearThemeParam();
  }, []);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = getSystemTheme();
      setResolved(next);
      applyTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    localStorage.setItem(THEME_STORAGE_KEY, p);
    const next = p === "system" ? getSystemTheme() : p;
    setResolved(next);
    applyTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setPreference(resolved === "dark" ? "light" : "dark");
  }, [resolved, setPreference]);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, toggle }),
    [preference, resolved, setPreference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** Inline script string, injected before hydration in app/layout.tsx to avoid FOUC. */
export const THEME_BOOTSTRAP_SCRIPT = `
(function(){
  try {
    var key = '${THEME_STORAGE_KEY}';
    var stored = null;
    try { stored = localStorage.getItem(key); } catch (e) {}

    // A valid theme carried from the other RIVA site is applied before paint
    // and persisted through the provider's normal storage key.
    var incoming = null;
    try {
      var value = new URLSearchParams(window.location.search).get('theme');
      if (value === 'light' || value === 'dark') incoming = value;
    } catch (e) {}
    if (incoming) {
      stored = incoming;
      try { localStorage.setItem(key, incoming); } catch (e) {}
    }

    var dark;
    if (stored === 'light') {
      dark = false;
    } else if (stored === 'dark') {
      dark = true;
    } else if (stored === 'system') {
      try {
        dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch (e) {
        dark = true;
      }
    } else {
      dark = true;
    }

    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;
