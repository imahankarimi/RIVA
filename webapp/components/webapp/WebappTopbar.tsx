"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { GLASS } from "@/components/webapp/glass";
import { TopbarActions } from "@/components/webapp/TopbarActions";
import { cn } from "@/lib/utils";

/** Premium floating Liquid Glass top bar — official RIVA brand asset on the
 *  left, Business Switcher + Profile on the right. Visible on tablet/mobile;
 *  on desktop the fixed sidebar carries the brand so the topbar can fold. */
export function WebappTopbar() {
  const { t } = useI18n();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4 md:hidden">
      <div
        className={cn(
          "pointer-events-auto mx-auto grid w-full max-w-[1120px] grid-cols-[1fr_auto] items-center gap-2 rounded-2xl px-3 py-2 sm:gap-3 sm:px-5 sm:py-2.5",
          GLASS.base,
          GLASS.glow,
          "relative transition-all duration-300 ease-out"
        )}
      >
        <Link
          href="/home"
          className="relative flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="RIVA"
        >
          <span className="relative block h-5 w-auto shrink-0 sm:h-6">
            <Image
              src="/brand/riva-mark.svg"
              alt=""
              width={36}
              height={30}
              priority
              className="h-full w-auto object-contain dark:hidden"
            />
            <Image
              src="/brand/riva-mark-dark.svg"
              alt=""
              width={36}
              height={30}
              priority
              className="hidden h-full w-auto object-contain dark:block"
            />
          </span>
          <span className="relative hidden sm:block">
            <Image
              src="/brand/riva-logo.svg"
              alt="RIVA"
              width={108}
              height={30}
              priority
              className="h-[22px] w-auto object-contain dark:hidden"
            />
            <Image
              src="/brand/riva-logo-dark.svg"
              alt="RIVA"
              width={108}
              height={30}
              priority
              className="hidden h-[22px] w-auto object-contain dark:block"
            />
          </span>
          <span className="hidden rounded-full border border-line/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-faint dark:text-ink-faint/80 md:inline-block">
            {t("webapp.eyebrow") || "Web"}
          </span>
        </Link>

        <TopbarActions />
      </div>
    </header>
  );
}