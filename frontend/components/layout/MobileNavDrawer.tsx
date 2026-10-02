"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Settings as SettingsIcon, Sparkle, X } from "lucide-react";
import { SidebarNavLinks } from "./SidebarNavLinks";
import { QuickActions } from "./QuickActions";
import { useSidebar } from "./SidebarContext";
import { useI18n } from "@/lib/i18n";
import { useAuth, useBusiness } from "@/app/providers";

export function MobileNavDrawer() {
  const { mobileOpen, closeMobile } = useSidebar();
  const { t, dir } = useI18n();
  const { user, logout } = useAuth();
  const { business } = useBusiness();
  const router = useRouter();
  const offscreen = dir === "rtl" ? 320 : -320;

  async function handleLogout() {
    closeMobile();
    await logout();
    router.replace("/login");
  }

  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";

  return (
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeMobile}
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px] lg:hidden"
            aria-hidden
          />
          <motion.aside
            key="panel"
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed inset-y-0 start-0 z-50 flex w-[82vw] max-w-[280px] flex-col border-e border-line bg-surface shadow-raised lg:hidden"
            role="dialog"
            aria-label={t("common.productName")}
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal-500 text-onSignal">
                  <Sparkle size={16} strokeWidth={2.5} />
                </div>
                <span className="font-display text-[15px] font-bold tracking-tight text-ink">
                  {t("common.productName")}
                </span>
              </div>
              <button
                onClick={closeMobile}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint hover:bg-surfaceMuted hover:text-ink"
                aria-label={t("common.close")}
              >
                <X size={16} />
              </button>
            </div>

            <SidebarNavLinks onNavigate={closeMobile} />

            <div className="border-t border-line-soft pt-2">
              <QuickActions onNavigate={closeMobile} />
            </div>

            <div className="border-t border-line p-3">
              <div className="mb-1 flex items-center gap-2.5 rounded-md px-2.5 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surfaceMuted text-xs font-semibold text-ink-soft">
                  {business.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{business.name}</p>
                  <p className="text-[11.5px] text-ink-faint">{business.currency}</p>
                </div>
              </div>

              {user && (
                <div className="mb-1 flex items-center gap-2.5 rounded-md px-2.5 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal-100 text-xs font-semibold text-signal-700">
                    {(displayName || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{displayName || user.email}</p>
                    <p className="truncate text-[11px] text-ink-faint">{user.email}</p>
                  </div>
                </div>
              )}

              <Link
                href="/settings"
                onClick={closeMobile}
                className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-ink-soft transition-colors duration-150 hover:bg-surfaceMuted hover:text-ink"
              >
                <SettingsIcon size={14} />
                {t("nav.settings")}
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start text-[13px] text-rose-700 transition-colors duration-150 hover:bg-rose-100/50"
              >
                <LogOut size={14} />
                {t("settings.logout")}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
