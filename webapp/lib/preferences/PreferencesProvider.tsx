"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "ledgerai.preferences";

interface Preferences {
  /** Whether TransactionCard's debit/credit breakdown starts expanded. */
  showAccountingTermsByDefault: boolean;
}

const DEFAULTS: Preferences = { showAccountingTermsByDefault: false };

interface PreferencesContextValue extends Preferences {
  setShowAccountingTermsByDefault: (value: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      // Corrupt or inaccessible storage — fall back to defaults silently.
    }
  }, []);

  const persist = useCallback((next: Preferences) => {
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Best-effort — the setting still applies for this session.
    }
  }, []);

  const setShowAccountingTermsByDefault = useCallback(
    (value: boolean) => persist({ ...prefs, showAccountingTermsByDefault: value }),
    [prefs, persist]
  );

  return (
    <PreferencesContext.Provider value={{ ...prefs, setShowAccountingTermsByDefault }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
