"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { mobileNavItems } from "./nav-items";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-content items-stretch justify-between px-2">
        {mobileNavItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          const isHero = item.href === "/assistant";
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5 text-[10.5px] font-medium"
              >
                <motion.span
                  whileTap={{ scale: 0.88 }}
                  animate={{ scale: active && isHero ? 1.06 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className={cn(
                    "flex items-center justify-center transition-colors duration-150",
                    isHero
                      ? cn(
                          "h-9 w-9 rounded-full",
                          active ? "bg-signal-500 text-onSignal" : "bg-signal-50 text-signal-600"
                        )
                      : cn("h-7 w-7", active ? "text-signal-600" : "text-ink-faint")
                  )}
                >
                  <Icon size={isHero ? 18 : 20} strokeWidth={2} />
                </motion.span>
                <span className={active ? "text-signal-700" : "text-ink-faint"}>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
