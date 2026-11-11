"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Wallet, Sparkle, LayoutGrid, BarChart3, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { TabBar, Button } from "@/components/glisse";
import { GLASS } from "@/components/webapp/glass";
import { triggerHaptic } from "@/lib/mobile-ux";
import { cn } from "@/lib/utils";
import {
  primaryNavItems,
  insightNavItems,
  planningNavItems,
  supportNavItems,
} from "./nav-items";

const TAB_ITEMS = [
  {
    value: "overview",
    label: "webapp.nav.overview",
    icon: Home,
    href: "/home",
  },
  {
    value: "transactions",
    label: "webapp.nav.transactions",
    icon: Wallet,
    href: "/cash",
  },
  {
    value: "assistant",
    label: "webapp.nav.assistant",
    icon: Sparkle,
    href: "/assistant",
  },
  {
    value: "insights",
    label: "webapp.nav.insights",
    icon: BarChart3,
    href: "/reports",
  },
  {
    value: "more",
    label: "webapp.nav.more",
    icon: LayoutGrid,
    href: "/more",
  },
] as const;

/**
 * Premium mobile tab bar with Glisse TabBar integration.
 *
 * Mobile UX enhancements:
 * - Permanently visible at bottom of viewport
 * - Haptic feedback on interactions
 * - Enhanced More sheet with refined design
 * - Touch-optimized spacing and hit areas
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);

  function getCurrentValue(): string | null {
    if (pathname === "/home" || pathname === "/") return "overview";
    if (pathname === "/cash" || pathname.startsWith("/cash/")) return "transactions";
    if (pathname === "/assistant" || pathname.startsWith("/assistant/")) return "assistant";
    if (pathname === "/reports" || pathname.startsWith("/reports/")) return "insights";
    return null;
  }

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

  // Transform TAB_ITEMS for Glisse TabBar with stable keys
  const glisseItems = TAB_ITEMS.map((item) => {
    const IconComponent = item.icon;
    return {
      value: item.value,
      label: t(item.label),
      icon: <IconComponent size={20} strokeWidth={2} />,
      href: item.href,
    };
  });

  const currentValue = getCurrentValue();

  return (
    <>
      {/* Floating Liquid Glass bottom tab bar — permanently visible */}
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-2.5 pb-[max(env(safe-area-inset-bottom),12px)] sm:pb-3 md:hidden"
        dir="ltr"
      >
        <div className="pointer-events-auto">
          <TabBar
            items={glisseItems}
            value={currentValue}
            onValueChange={(value) => {
              if (value === "more") {
                triggerHaptic("medium");
                setMoreOpen(true);
              } else {
                triggerHaptic("light");
              }
            }}
            className="shadow-[0_6px_24px_-6px_rgba(16,28,44,0.3),0_1px_2px_rgba(16,28,44,0.1)]"
          />
        </div>
      </nav>

      {/* More — enhanced full navigation sheet */}
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            {/* Backdrop with refined blur */}
            <motion.button
              aria-label={t("common.close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                triggerHaptic("light");
                setMoreOpen(false);
              }}
              className="absolute inset-0 bg-ink/30 backdrop-blur-md dark:bg-black/50"
            />

            {/* Sheet with enhanced design */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className={cn(
                "absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[28px] px-3 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 sm:rounded-t-[32px]",
                GLASS.base,
                GLASS.glow,
                "shadow-[0_-8px_48px_-8px_rgba(16,28,44,0.25)]"
              )}
            >
              {/* Grabber with enhanced visibility */}
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/20 dark:bg-warm-white/20" />

              {/* Header with improved spacing */}
              <div className="mb-5 flex items-center justify-between px-2">
                <h2 className="font-display text-[17px] font-bold text-ink dark:text-warm-white">
                  {t("webapp.more.title")}
                </h2>

                <Button
                  onClick={() => {
                    triggerHaptic("light");
                    setMoreOpen(false);
                  }}
                  aria-label={t("common.close")}
                  variant="glass"
                  className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-full p-0"
                >
                  <X size={18} strokeWidth={2.5} />
                </Button>
              </div>

              {/* Navigation sections — refined design */}
              <div className="space-y-4 px-1 pb-3">
                {sections.map((section) => (
                  <div key={section.label}>
                    <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                      {section.label}
                    </p>

                    <div className="overflow-hidden rounded-[18px] border border-line/70 bg-surface/80 shadow-sm backdrop-blur-sm dark:border-line/40 dark:bg-surface/60">
                      {section.items.map((item) => {
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                              triggerHaptic("selection");
                              setMoreOpen(false);
                            }}
                            className="flex min-h-[52px] items-center gap-3 border-b border-line/50 px-4 py-3 text-[14px] font-medium text-ink transition-all duration-150 last:border-b-0 hover:bg-surface-muted/60 active:scale-[0.98] active:bg-surface-muted/90 dark:border-line/30 dark:text-warm-white dark:hover:bg-surface-muted/40 dark:active:bg-surface-muted/60"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted/70 text-ink-faint transition-all dark:bg-surface-muted/50 dark:text-ink-faint">
                              <Icon size={17} strokeWidth={2.2} />
                            </div>

                            <span className="flex-1">{t(item.labelKey)}</span>
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
