"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronsUpDown,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { SidebarNavLinks } from "./SidebarNavLinks";
import { QuickActions } from "./QuickActions";
import { useSidebar } from "./SidebarContext";
import { useI18n } from "@/lib/i18n";
import { useBusiness, useAuth } from "@/app/providers";
import { cn } from "@/lib/utils";
import {
  DURATION,
  EASE_OUT,
  SPRING_SOFT,
} from "@/lib/motion/tokens";

export function Sidebar() {
  const { t } = useI18n();
  const { business, businesses, setBusinessId } = useBusiness();
  const { user, logout } = useAuth();
  const {
    hovered,
    setHovered,
    displayedCollapsed,
  } = useSidebar();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ")
    : "";

  const initial = (displayName || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <motion.aside
      animate={{ width: displayedCollapsed ? 76 : 248 }}
      transition={SPRING_SOFT}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative hidden h-full shrink-0 flex-col overflow-hidden lg:flex"
    >
      {/* Inset card shell — ports the Shadcn inset sidebar's visual
          language (floating rounded surface over the paper page) around
          RIVA's existing spring width animation. */}
      <div className="m-2 flex h-[calc(100vh-1rem)] w-auto flex-col overflow-hidden rounded-xl bg-sidebar text-sidebar-foreground shadow-subtle ring-1 ring-line/70">
        {/* RIVA brand */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center px-5",
            displayedCollapsed && "justify-center px-0"
          )}
        >
          <Link
            href="/overview"
            aria-label="RIVA"
            className="flex shrink-0 items-center"
          >
            <AnimatePresence mode="wait" initial={false}>
              {displayedCollapsed ? (
                <motion.div
                  key="riva-mark"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                  className="relative h-9 w-9"
                >
                  {/* Light mode */}
                  <Image
                    src="/brand/riva-mark.svg"
                    alt="RIVA"
                    fill
                    priority
                    sizes="36px"
                    className="object-contain dark:hidden"
                  />

                  {/* Dark mode */}
                  <Image
                    src="/brand/riva-mark-dark.svg"
                    alt="RIVA"
                    fill
                    priority
                    sizes="36px"
                    className="hidden object-contain dark:block"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="riva-logo"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}
                  className="relative h-9 w-[108px]"
                >
                  {/* Light mode */}
                  <Image
                    src="/brand/riva-logo.svg"
                    alt="RIVA"
                    fill
                    priority
                    sizes="108px"
                    className="object-contain object-left dark:hidden"
                  />

                  {/* Dark mode */}
                  <Image
                    src="/brand/riva-logo-dark.svg"
                    alt="RIVA"
                    fill
                    priority
                    sizes="108px"
                    className="hidden object-contain object-left dark:block"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <SidebarNavLinks collapsed={displayedCollapsed} />

        <div className="mt-auto shrink-0 border-t border-line-soft pt-2">
          <QuickActions collapsed={displayedCollapsed} />
        </div>

        <div className="shrink-0 border-t border-line p-3">
          {/* Business switcher */}
          <button
            onClick={() => {
              if (displayedCollapsed || businesses.length < 2) return;

              const currentIndex = businesses.findIndex(
                (b) => b.id === business.id
              );

              const next =
                businesses[(currentIndex + 1) % businesses.length];

              if (next) {
                setBusinessId(next.id);
              }
            }}
            title={displayedCollapsed ? business.name : undefined}
            className={cn(
              "relative mb-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start transition-colors duration-150 hover:bg-sidebar-accent",
              displayedCollapsed && "justify-center px-0"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
              {business.name.charAt(0)}
            </div>

            <motion.div
                initial={{
                  display: displayedCollapsed ? "none" : "inline-block",
                  opacity: displayedCollapsed ? 0 : 1,
                }}
                animate={{
                  display: displayedCollapsed ? "none" : "inline-block",
                  opacity: displayedCollapsed ? 0 : 1,
                }}
                transition={{ duration: DURATION.base, ease: EASE_OUT }}
                className="min-w-0 flex-1 whitespace-pre !p-0 !m-0"
              >
                <p className="truncate text-[13px] font-medium text-sidebar-foreground">
                  {business.name}
                </p>

                <p className="truncate text-[11.5px] text-ink-faint">
                  {business.currency}
                </p>
              </motion.div>

            <motion.div
              initial={{
                display:
                  displayedCollapsed || businesses.length <= 1 ? "none" : "inline-block",
                opacity: displayedCollapsed || businesses.length <= 1 ? 0 : 1,
              }}
              animate={{
                display:
                  displayedCollapsed || businesses.length <= 1 ? "none" : "inline-block",
                opacity: displayedCollapsed || businesses.length <= 1 ? 0 : 1,
              }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              className="whitespace-pre !p-0 !m-0"
            >
              <ChevronsUpDown size={14} className="text-ink-faint" />
            </motion.div>
          </button>

          {/* Profile / account */}
          {user && (
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setAccountOpen((v) => !v)}
                onBlur={() =>
                  setTimeout(() => setAccountOpen(false), 120)
                }
                className={cn(
                  "relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start transition-colors duration-150 hover:bg-sidebar-accent",
                  displayedCollapsed && "justify-center px-0"
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                  {initial}
                </div>

                <motion.div
                    initial={{
                      display: displayedCollapsed ? "none" : "inline-block",
                      opacity: displayedCollapsed ? 0 : 1,
                    }}
                    animate={{
                      display: displayedCollapsed ? "none" : "inline-block",
                      opacity: displayedCollapsed ? 0 : 1,
                    }}
                    transition={{ duration: DURATION.base, ease: EASE_OUT }}
                    className="min-w-0 flex-1 whitespace-pre !p-0 !m-0"
                  >
                    <p className="truncate text-[13px] font-medium text-sidebar-foreground">
                      {displayName || user.email}
                    </p>

                    <p className="truncate text-[11px] text-ink-faint">
                      {user.email}
                    </p>
                  </motion.div>
              </motion.button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 6,
                      scale: 0.98,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 6,
                      scale: 0.98,
                    }}
                    transition={SPRING_SOFT}
                    className="absolute bottom-full start-0 z-50 mb-2 w-56 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-raised"
                  >
                    <Link
                      href="/settings"
                      onMouseDown={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-ink-soft transition-colors duration-150 hover:bg-surfaceMuted hover:text-ink"
                    >
                      <SettingsIcon size={14} />
                      {t("profile.editProfile")}
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
          )}
        </div>
      </div>
    </motion.aside>
  );
}