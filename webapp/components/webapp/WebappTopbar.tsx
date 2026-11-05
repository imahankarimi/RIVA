"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { TopbarActions } from "@/components/webapp/TopbarActions";
import { Glass, Button } from "@/components/glisse";
import { cn } from "@/lib/utils";

/**
 * Premium floating Glisse glass top bar — official RIVA brand asset on the
 * left, Business Switcher + Theme Switcher + Profile on the right.
 *
 * Uses Glisse Glass component with proper GLASS tokens to match the visual
 * language of the bottom TabBar — both are navigation surfaces using the same
 * Liquid Glass material.
 *
 * Mobile UX enhancements:
 * - Permanently visible at top of viewport
 * - Touch-optimized hit areas
 * - Native Glisse glass styling and interactions
 * - Consistent with bottom tab bar design language
 * - Context-aware: in AI Assistant, shows menu button instead of logo
 */
export function WebappTopbar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const isAssistant = pathname === "/assistant" || pathname?.startsWith("/assistant/");

  const handleMenuToggle = () => {
    if (typeof window !== "undefined" && (window as any).__assistantToggleSidebar) {
      (window as any).__assistantToggleSidebar();
    }
  };

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-2.5 sm:px-4 sm:pt-3 md:hidden"
    >
      <Glass
        className={cn(
          "pointer-events-auto mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3 rounded-[20px] px-4 py-2.5 sm:px-4 sm:py-3"
        )}
      >
        {isAssistant ? (
          // AI Assistant: Show Glisse menu button in logo position
          <Button
            variant="glass"
            onClick={handleMenuToggle}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-0"
            )}
            aria-label={t("common.openMenu")}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 10h14M3 5h14M3 15h14" />
            </svg>
          </Button>
        ) : (
          // Other pages: Show RIVA logo
          <Link
            href="/home"
            className="group relative flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80 active:scale-95"
            aria-label="RIVA"
          >
            {/* Mobile: Mark only (increased size) */}
            <span className="relative block h-7 w-auto shrink-0 sm:hidden">
              <Image
                src="/brand/riva-mark.svg"
                alt=""
                width={42}
                height={35}
                priority
                className="h-full w-auto object-contain dark:hidden"
              />
              <Image
                src="/brand/riva-mark-dark.svg"
                alt=""
                width={42}
                height={35}
                priority
                className="hidden h-full w-auto object-contain dark:block"
              />
            </span>

            {/* Tablet+: Mark + Logo (increased size) */}
            <span className="relative hidden items-center gap-2.5 sm:flex">
              <span className="relative block h-7 w-auto shrink-0">
                <Image
                  src="/brand/riva-mark.svg"
                  alt=""
                  width={42}
                  height={35}
                  priority
                  className="h-full w-auto object-contain dark:hidden"
                />
                <Image
                  src="/brand/riva-mark-dark.svg"
                  alt=""
                  width={42}
                  height={35}
                  priority
                  className="hidden h-full w-auto object-contain dark:block"
                />
              </span>
              <span className="relative">
                <Image
                  src="/brand/riva-logo.svg"
                  alt="RIVA"
                  width={108}
                  height={35}
                  priority
                  className="h-7 w-auto object-contain dark:hidden"
                />
                <Image
                  src="/brand/riva-logo-dark.svg"
                  alt="RIVA"
                  width={108}
                  height={35}
                  priority
                  className="hidden h-7 w-auto object-contain dark:block"
                />
              </span>
            </span>

            {/* "Web" badge */}
            <span className="hidden rounded-full border border-line/40 bg-ink/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint backdrop-blur-sm transition-colors group-hover:border-line/60 md:inline-block">
              {t("webapp.eyebrow") || "Web"}
            </span>
          </Link>
        )}

        <TopbarActions />
      </Glass>
    </header>
  );
}
