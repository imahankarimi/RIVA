"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Wallet, Sparkle, LayoutGrid, BarChart3, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GLASS } from "@/components/webapp/glass";
import { cn } from "@/lib/utils";
import {
  primaryNavItems,
  insightNavItems,
  planningNavItems,
  supportNavItems,
} from "./nav-items";

const TAB_ITEMS = [
  {
    id: "overview",
    label: "webapp.nav.overview",
    icon: Home,
    href: "/home",
  },
  {
    id: "transactions",
    label: "webapp.nav.transactions",
    icon: Wallet,
    href: "/cash",
  },
  {
    id: "assistant",
    label: "webapp.nav.assistant",
    icon: Sparkle,
    href: "/assistant",
  },
  {
    id: "insights",
    label: "webapp.nav.insights",
    icon: BarChart3,
    href: "/reports",
  },
  {
    id: "more",
    label: "webapp.nav.more",
    icon: LayoutGrid,
    href: "/more",
  },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);

  function isActive(href: string): boolean {
    if (href === "/home") return pathname === "/home" || pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sections = [
    { label: t("sidebar.workspace"), items: primaryNavItems },
    { label: t("sidebar.insights"), items: insightNavItems },
    { label: t("sidebar.planning"), items: planningNavItems },
    { label: t("sidebar.support"), items: supportNavItems },
  ];

  return (
    <>
      {/* Floating Liquid Glass bottom tab bar */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),12px)] sm:pb-4 md:hidden">
        <div
          className={cn(
            "pointer-events-auto relative grid w-fit grid-cols-5 items-end rounded-3xl px-2 py-2",
            GLASS.base,
            GLASS.glow,
            "transition-all duration-300 ease-out"
          )}
        >
          {TAB_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isAssistant = item.id === "assistant";

            if (item.id === "more") {
              return (
                <button
                  key={item.id}
                  onClick={() => setMoreOpen(true)}
                  aria-label={t(item.label)}
                  title={t(item.label)}
                  className={cn(
                    "group relative flex min-w-[60px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5 py-2 transition-all duration-200",
                    active
                      ? "bg-white/80 text-deep-ink shadow-sm dark:bg-white/15 dark:text-warm-white"
                      : "text-deep-ink/60 hover:bg-white/50 hover:text-deep-ink dark:text-warm-white/60 dark:hover:bg-white/15 dark:hover:text-warm-white"
                  )}
                >
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <Icon size={18} strokeWidth={2} />
                  </span>

                  <span className="relative text-[9.5px] font-semibold tracking-tight">
                    {t(item.label)}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={t(item.label)}
                className={cn(
                  "group relative flex min-w-[60px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5 py-2 transition-all duration-200",
                  isAssistant
                    ? cn(
                        "scale-[1.07] bg-deep-navy text-warm-white shadow-[0_16px_36px_-16px_rgba(16,28,44,0.8)]",
                        "dark:bg-warm-white dark:text-deep-ink dark:shadow-[0_12px_28px_-12px_rgba(247,247,243,0.3)]",
                        "hover:scale-[1.09] active:scale-[1.03]"
                      )
                    : active
                      ? cn(
                          "bg-white/80 text-deep-ink shadow-sm dark:bg-white/15 dark:text-warm-white",
                          "hover:bg-white/90 dark:hover:bg-white/20 active:bg-white/70 dark:active:bg-white/10"
                        )
                      : cn(
                          "text-deep-ink/60 hover:bg-white/50 hover:text-deep-ink dark:text-warm-white/60",
                          "dark:hover:bg-white/15 dark:hover:text-warm-white active:bg-white/40 dark:active:bg-white/10"
                        )
                )}
              >
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <Icon size={18} strokeWidth={isAssistant ? 2.2 : 2} />
                </span>

                <span
                  className={cn(
                    "relative text-[9.5px] font-semibold tracking-tight",
                    isAssistant
                      ? "text-warm-white dark:text-deep-ink"
                      : active
                        ? "text-deep-ink dark:text-warm-white"
                        : "text-deep-ink/60 dark:text-warm-white/60"
                  )}
                >
                  {t(item.label)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More — full navigation sheet */}
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <motion.button
              aria-label={t("common.close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMoreOpen(false)}
              className="absolute inset-0 bg-ink/25 backdrop-blur-[2px] dark:bg-black/40"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3",
                GLASS.base,
                GLASS.glow
              )}
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-deep-ink/15 dark:bg-warm-white/15" />

              <div className="flex items-center justify-between px-2 pb-2">
                <h2 className="font-display text-[15px] font-bold text-deep-ink dark:text-warm-white">
                  {t("webapp.more.title")}
                </h2>

                <button
                  onClick={() => setMoreOpen(false)}
                  aria-label={t("common.close")}
                  className="rounded-lg p-1.5 text-deep-ink/60 hover:bg-white/40 hover:text-deep-ink dark:text-warm-white/60 dark:hover:bg-white/10 dark:hover:text-warm-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 px-1 pb-2">
                {sections.map((section) => (
                  <div key={section.label}>
                    <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                      {section.label}
                    </p>

                    <div className="overflow-hidden rounded-xl border border-line/70 bg-white/40 dark:border-white/10 dark:bg-surfaceRaised/40">
                      {section.items.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 border-b border-line/50 px-3 py-2.5 text-[13px] font-medium transition-colors last:border-b-0",
                              active
                                ? "bg-signal-50 text-signal-700"
                                : "text-deep-ink hover:bg-white/60 dark:text-warm-white dark:hover:bg-white/10"
                            )}
                          >
                            <Icon
                              size={16}
                              strokeWidth={2}
                              className={cn(
                                "shrink-0",
                                active
                                  ? "text-signal-600"
                                  : "text-ink-faint"
                              )}
                            />

                            <span>{t(item.labelKey)}</span>

                            {item.href === "/home" && (
                              <span className="ms-auto rounded-full bg-signal-100 px-2 py-0.5 text-[10px] font-semibold text-signal-700 dark:bg-signal-900/40 dark:text-signal-400">
                                {t("webapp.eyebrow")}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}