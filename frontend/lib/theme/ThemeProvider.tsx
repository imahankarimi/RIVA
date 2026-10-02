"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "ledgerai.theme";

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
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? "dark";
    setPreferenceState(stored);
    const next = stored === "system" ? getSystemTheme() : stored;
    setResolved(next);
    applyTheme(next);
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
    localStorage.setItem(STORAGE_KEY, p);
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
    var v = localStorage.getItem('${STORAGE_KEY}');
    var dark = v !== 'light';
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
