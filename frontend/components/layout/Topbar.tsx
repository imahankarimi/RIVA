"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Menu, LogOut, Settings as SettingsIcon, Sun, Moon } from "lucide-react";
import { useI18n, localeMeta, type Locale } from "@/lib/i18n";
import { useAuth } from "@/app/providers";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";
import { useTheme } from "@/lib/theme/ThemeProvider";

const dropdownMotion = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: DURATION.base, ease: EASE_OUT },
};

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { t, locale, setLocale } = useI18n();
  const { user, logout } = useAuth();
  const { resolved, toggle } = useTheme();
  const { openMobile } = useSidebar();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  const initial = (displayName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur sm:px-6">
      <button
        onClick={openMobile}
        className="-ms-1 flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-surfaceMuted lg:hidden"
        aria-label={t("common.openMenu")}
      >
        <Menu size={19} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-[17px] font-bold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="hidden truncate text-[12.5px] text-ink-faint sm:block">{subtitle}</p>}
      </div>


      <button
        onClick={toggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-soft transition-colors duration-150 hover:bg-surfaceMuted"
        aria-label={resolved === "dark" ? t("common.switchToLight") : t("common.switchToDark")}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={resolved}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: DURATION.fast, ease: EASE_OUT }}
            className="flex"
          >
            {resolved === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </motion.span>
        </AnimatePresence>
      </button>

      <div className="relative">
        <button
          onClick={() => setLangOpen((v) => !v)}
          onBlur={() => setTimeout(() => setLangOpen(false), 120)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-soft transition-colors duration-150 hover:bg-surfaceMuted sm:w-auto sm:gap-1.5 sm:px-3"
          aria-label={t("common.changeLanguage")}
        >
          <Globe size={16} />
        </button>
        <AnimatePresence>
          {langOpen && (
            <motion.div
              {...dropdownMotion}
              className="absolute end-0 top-11 w-40 origin-top-end overflow-hidden rounded-md border border-line bg-surface py-1 shadow-raised"
            >
              {(Object.keys(localeMeta) as Locale[]).map((l) => (
                <button
                  key={l}
                  onMouseDown={() => setLocale(l)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] transition-colors duration-150 hover:bg-surfaceMuted",
                    l === locale ? "text-signal-700" : "text-ink-soft"
                  )}
                >
                  {localeMeta[l].flagImage ? (
                    <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                      <Image
                        src={localeMeta[l].flagImage!}
                        alt={localeMeta[l].label}
                        width={16}
                        height={16}
                        className="h-4 w-4 object-contain"
                      />
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center text-base leading-none">
                      {localeMeta[l].flag}
                    </span>
                  )}
                  {localeMeta[l].nativeLabel}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAccountOpen((v) => !v)}
          onBlur={() => setTimeout(() => setAccountOpen(false), 120)}
          aria-label={t("common.accountMenu")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal-500 text-[12.5px] font-semibold text-onSignal"
        >
          {initial}
        </motion.button>
        <AnimatePresence>
          {accountOpen && (
            <motion.div
              {...dropdownMotion}
              className="absolute end-0 top-11 w-56 origin-top-end overflow-hidden rounded-md border border-line bg-surface py-1 shadow-raised"
            >
              {user && (
                <div className="border-b border-line px-3 py-2.5">
                  <p className="truncate text-[13px] font-medium text-ink">{displayName || user.email}</p>
                  <p className="truncate text-[11.5px] text-ink-faint">{user.email}</p>
                </div>
              )}
              <Link
                href="/settings"
                onMouseDown={() => setAccountOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-ink-soft transition-colors duration-150 hover:bg-surfaceMuted hover:text-ink"
              >
                <SettingsIcon size={14} />
                {t("nav.settings")}
              </Link>
              <button
                onMouseDown={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-rose-700 transition-colors duration-150 hover:bg-rose-100/50"
              >
                <LogOut size={14} />
                {t("settings.logout")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
