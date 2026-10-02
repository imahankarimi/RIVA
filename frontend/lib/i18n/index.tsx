"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "./dictionaries/en";
import fa from "./dictionaries/fa";
import type { Dictionary } from "./dictionaries/en";

export type Locale = "en" | "fa";

const dictionaries: Record<Locale, Dictionary> = { en, fa };

const directions: Record<Locale, "ltr" | "rtl"> = { en: "ltr", fa: "rtl" };

// Locale metadata kept alongside translations so adding a language is a
// single new entry here + a new dictionary file, no changes anywhere else.
export const localeMeta: Record<
  Locale,
  { label: string; nativeLabel: string; flag: string; flagImage?: string }
> = {
  en: { label: "English", nativeLabel: "English", flag: "🇬🇧" },
  fa: { label: "Persian", nativeLabel: "Persian", flag: "", flagImage: "/images/flags/persian-logo.webp" },
};

type Get = (path: string, vars?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: Get;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolve(dict: Dictionary, path: string): string {
  if (!path) {
    console.error("❌ i18n: t() received invalid path:", path);
    return "";
  }

  const parts = path.split(".");
  let node: unknown = dict;

  for (const p of parts) {
    if (typeof node === "object" && node !== null && p in node) {
      node = (node as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }

  return typeof node === "string" ? node : path;
}

const STORAGE_KEY = "ledgerai.locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "en" || stored === "fa") setLocaleState(stored);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const dir = directions[locale];

  useEffect(() => {
  document.documentElement.dir = dir;
  document.documentElement.lang = locale;
  document.documentElement.dataset.locale = locale;
}, [dir, locale]);

  const t = useCallback<Get>(
    (path, vars) => {
      let str = resolve(dictionaries[locale], path);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, dir, setLocale, t }), [locale, dir, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
