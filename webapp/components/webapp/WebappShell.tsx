"use client";

import { useAuth } from "@/app/providers";
import { useI18n } from "@/lib/i18n";
import { PreviewAuthSheet } from "@/components/preview/PreviewAuthSheet";
import { PreviewIntentResumer } from "@/components/preview/PreviewIntentResumer";
import { SessionKeyed } from "@/components/preview/SessionKeyed";
import { AddIncomeProvider } from "@/components/transactions/AddIncomeContext";
import { WebappTopbar } from "@/components/webapp/WebappTopbar";
import { WebappDesktopBar } from "@/components/webapp/WebappDesktopBar";
import { WebappSidebar } from "@/components/webapp/WebappSidebar";
import { MobileTabBar } from "@/components/webapp/MobileTabBar";

/**
 * RIVA Web application shell.
 *
 * One shell serves both states: an authenticated session renders its own data,
 * a guest renders the same chrome with privacy-safe previews. The shell itself
 * never fetches account data — that decision lives in the pages and hooks.
 *
 * `SessionKeyed` is the client-side cache boundary: logging out, expiring, or
 * switching business remounts the routed subtree so no previous account's
 * in-memory state can survive into the next state.
 */
export function WebappShell({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { t } = useI18n();

  if (status === "loading") {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper text-sm text-ink-faint">
        {t("common.loading")}
      </main>
    );
  }

  return (
    <SessionKeyed>
      <AddIncomeProvider>
        <PreviewIntentResumer />
        <div className="flex h-dvh flex-col bg-paper font-sans text-ink antialiased md:h-screen">
          <div className="flex min-h-0 flex-1 md:overflow-hidden">
            <WebappSidebar />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <WebappDesktopBar />
              <main
                id="webapp-main-scroll"
                className="relative min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pt-[5rem] pb-[calc(env(safe-area-inset-bottom)+76px)] md:overflow-y-auto md:overscroll-contain md:pb-8 md:pt-0"
              >
                {children}
              </main>
            </div>
          </div>
          <WebappTopbar />
          <MobileTabBar />
        </div>
        <PreviewAuthSheet />
      </AddIncomeProvider>
    </SessionKeyed>
  );
}
