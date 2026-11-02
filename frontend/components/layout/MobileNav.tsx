"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ArrowLeftRight, Sparkles, BookOpen, Settings } from "lucide-react";
import { GLASS } from "@/components/layout/glass";
import { MOBILE_NAV } from "./nav-items";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * RIVA Main — floating mobile navigation.
 *
 * Design-system rules implemented here (docs/DESIGN_SYSTEM.md → Navigation):
 *
 *   - Navigation is the ONLY surface permitted to use Liquid Glass. Content
 *     surfaces stay opaque and crisp so data remains maximally readable.
 *   - The bar FLOATS: an inset, rounded, blurred pill separated from the
 *     bottom edge by a visible gap, never a static strip welded to the page.
 *     This is what makes RIVA feel like a native app rather than a desktop
 *     layout squeezed onto a phone.
 *   - It clears the home indicator via `env(safe-area-inset-bottom)`.
 *   - The RIVA Assistant is the centre tab and is rendered as a raised,
 *     inverted "hero" — the visual centre of gravity of the bar.
 *   - The wrapper is `pointer-events-none` with pointer events restored on the
 *     pill, so the transparent gutter never blocks scrolling content behind it.
 *   - Labels are 9.5px/600: the only place RIVA goes below its type floor,
 *     because a five-column bar cannot carry readable labels otherwise.
 *
 * The full grouped navigation (including RIVA Advisor) is reachable through
 * `MobileNavDrawer`, opened from the topbar hamburger.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  function isActive(href: string): boolean {
    if (href === "/overview") return pathname === "/overview" || pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label={t("common.productName")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),12px)] lg:hidden"
    >
      <div
        className={cn(
          "pointer-events-auto relative grid w-fit grid-cols-5 items-end rounded-3xl px-2 py-2",
          GLASS.base,
          GLASS.glow
        )}
      >
        {MOBILE_NAV.map(({ href, labelKey, icon: Icon, hero }) => {
          const active = isActive(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "glass-lens group relative flex min-w-[60px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5 py-2 transition-all duration-200",
                hero
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
                <Icon size={18} strokeWidth={hero ? 2.2 : 2} />
              </span>
              <span
                className={cn(
                  "relative text-[9.5px] font-semibold tracking-tight",
                  hero
                    ? "text-warm-white dark:text-deep-ink"
                    : active
                      ? "text-deep-ink dark:text-warm-white"
                      : "text-deep-ink/60 dark:text-warm-white/60"
                )}
              >
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}