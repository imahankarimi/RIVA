"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clearPreviewReturnTo,
  readPreviewIntent,
  savePreviewIntent,
  savePreviewReturnTo,
  type PreviewIntent,
} from "@/lib/preview/intent";

type PreviewAuthStatus = "loading" | "authenticated" | "unauthenticated";
type PreviewSessionEnded = "logout" | "expired" | null;

interface AuthPromptOptions {
  /** i18n key explaining why authentication is needed right now. */
  reasonKey?: string;
  intent?: PreviewIntent;
  /** Open the sheet already on the sign-in or create-account form. */
  mode?: "login" | "signup";
}

interface PreviewContextValue {
  /** No valid session: the real shell renders with private content locked. */
  isGuest: boolean;
  isAuthenticated: boolean;
  authPrompt: AuthPromptOptions | null;
  openAuthPrompt: (options?: AuthPromptOptions) => void;
  closeAuthPrompt: (options?: { discardIntent?: boolean }) => void;
  completeAuthPrompt: () => void;
  pendingIntent: PreviewIntent | null;
  consumePendingIntent: () => PreviewIntent | null;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({
  status,
  sessionEnded,
  children,
}: {
  status: PreviewAuthStatus;
  sessionEnded: PreviewSessionEnded;
  children: React.ReactNode;
}) {
  const isGuest = status === "unauthenticated";
  const isAuthenticated = status === "authenticated";

  const [authPrompt, setAuthPrompt] = useState<AuthPromptOptions | null>(null);
  const [pendingIntent, setPendingIntent] = useState<PreviewIntent | null>(() => readPreviewIntent());
  const expiryHandled = useRef(false);

  const openAuthPrompt = useCallback((options?: AuthPromptOptions) => {
    // Authentication is already the state — never stack a prompt on top of it.
    if (typeof window === "undefined") return;
    const returnTo = `${window.location.pathname}${window.location.search}`;
    savePreviewReturnTo(returnTo);
    const intent = options?.intent ?? null;
    savePreviewIntent(intent);
    setPendingIntent(intent);
    setAuthPrompt({
      reasonKey: options?.reasonKey ?? "preview.signInToContinue",
      intent: intent ?? undefined,
      mode: options?.mode ?? "login",
    });
  }, []);

  const closeAuthPrompt = useCallback((options?: { discardIntent?: boolean }) => {
    // Dismissing the sheet ends the hand-off: there is no pending operation to
    // resume and no reason to remember the previous route.
    clearPreviewReturnTo();
    setAuthPrompt(null);
    if (options?.discardIntent !== false) {
      setPendingIntent(null);
      savePreviewIntent(null);
    }
  }, []);

  const completeAuthPrompt = useCallback(() => {
    // Keep the remembered intent: the operation was interrupted by auth and
    // should be offered again once the account is available. Nothing runs
    // automatically. The return path is no longer needed — the guest stayed on
    // the current section while the sheet was open.
    clearPreviewReturnTo();
    setAuthPrompt(null);
  }, []);

  const consumePendingIntent = useCallback(() => {
    const intent = pendingIntent;
    if (intent) {
      setPendingIntent(null);
      savePreviewIntent(null);
    }
    return intent;
  }, [pendingIntent]);

  // A mid-session expiry gets one contextual reauthentication prompt. Dismissing
  // it must not make it reappear on every render.
  useEffect(() => {
    if (sessionEnded === "expired" && !expiryHandled.current) {
      expiryHandled.current = true;
      setAuthPrompt({ reasonKey: "preview.sessionExpired" });
    }
    if (sessionEnded === null) expiryHandled.current = false;
  }, [sessionEnded]);

  const value = useMemo<PreviewContextValue>(
    () => ({
      isGuest,
      isAuthenticated,
      authPrompt,
      openAuthPrompt,
      closeAuthPrompt,
      completeAuthPrompt,
      pendingIntent,
      consumePendingIntent,
    }),
    [
      isGuest,
      isAuthenticated,
      authPrompt,
      openAuthPrompt,
      closeAuthPrompt,
      completeAuthPrompt,
      pendingIntent,
      consumePendingIntent,
    ]
  );

  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview() {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview must be used within PreviewProvider");
  return ctx;
}
