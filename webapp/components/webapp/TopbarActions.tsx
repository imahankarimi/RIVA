"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LogOut, UserCircle2, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/providers";
import { useBusiness } from "@/app/providers";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { CURRENCY_META } from "@/lib/currency";

const dropdownMotion = {
  initial: { opacity: 0, y: -8, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.95 },
  transition: { type: "spring", stiffness: 300, damping: 30 },
};

export function TopbarActions() {
  const { user, logout } = useAuth();
  const { business, businesses, setBusinessId } = useBusiness();
  const { resolved, toggle } = useTheme();
  const [businessOpen, setBusinessOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close both menus when clicking anywhere outside the cluster (including on
  // another topbar control — no focus trap, a plain document listener).
  useEffect(() => {
    if (!businessOpen && !profileOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setBusinessOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [businessOpen, profileOpen]);

  // Close menus with Escape for keyboard users.
  useEffect(() => {
    if (!businessOpen && !profileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setBusinessOpen(false);
        setProfileOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [businessOpen, profileOpen]);

  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : "";

  return (
    <div ref={rootRef} className="flex items-center gap-1 sm:gap-2">
      {/* Theme toggle — top-left button in the mobile floating topbar (the
          desktop slot lives in WebappDesktopBar next to this cluster). */}
      <button
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-md text-deep-ink/60 transition-colors duration-150 hover:bg-white/40 hover:text-deep-ink dark:text-warm-white/60 dark:hover:bg-white/10 dark:hover:text-warm-white"
        aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={resolved}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="flex"
          >
            {resolved === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Business Switcher — shown whenever there is more than one business.
          Switches via the real business context (no fake data). */}
      {businesses.length > 1 && (
        <div className="relative">
          <button
            onClick={() => setBusinessOpen(!businessOpen)}
            aria-expanded={businessOpen}
            aria-haspopup="listbox"
            className={cn(
              "flex items-center gap-1 sm:gap-2 rounded-lg border px-1.5 sm:px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium transition-all",
              businessOpen
                ? "border-signal-300 bg-signal-50/60"
                : "border-line bg-surface hover:border-signal-200"
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-signal-100 text-[9px] font-bold text-signal-700">
              {business.name.charAt(0)}
            </span>
            <span className="hidden max-w-[100px] truncate text-ink sm:inline">{business.name}</span>
            <ChevronDown
              size={12}
              className={cn("transition-transform", businessOpen && "rotate-180")}
            />
          </button>

          <AnimatePresence>
            {businessOpen && (
              <motion.div
                {...dropdownMotion}
                className="absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-lg border border-line bg-surface shadow-raised"
              >
                <div className="p-1">
                  {businesses.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setBusinessId(b.id);
                        setBusinessOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12px] transition-colors",
                        b.id === business.id
                          ? "bg-signal-50 text-signal-700"
                          : "text-ink-soft hover:bg-surfaceMuted hover:text-ink"
                      )}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surfaceMuted text-[11px] font-bold text-ink-soft">
                        {b.name.charAt(0)}
                      </span>
                      <span className="min-w-0 text-left">
                        <span className="block truncate font-medium text-[12px]">{b.name}</span>
                        <span className="block text-[10px] text-ink-faint">
                          {CURRENCY_META[b.currency].flag} {b.currency}
                        </span>
                      </span>
                      {b.id === business.id && (
                        <span className="ml-auto text-signal-700">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Profile Menu */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          className="flex items-center gap-1 rounded-lg border border-line bg-surface px-1.5 py-1.5 transition-all hover:border-signal-200 sm:px-2"
          title={displayName}
        >
          <Avatar
            name={displayName}
            size="sm"
            className="h-6 w-6 text-[10px]"
          />
          <ChevronDown
            size={12}
            className={cn("text-ink-faint transition-transform hidden sm:block", profileOpen && "rotate-180")}
          />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              {...dropdownMotion}
              className="absolute right-0 top-full mt-2 z-50 min-w-[180px] rounded-lg border border-line bg-surface shadow-raised"
            >
              <div className="border-b border-line px-3 py-2.5">
                <p className="text-[12px] font-semibold text-ink truncate">{displayName}</p>
                <p className="text-[10px] text-ink-faint truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-ink-soft transition-colors hover:bg-surfaceMuted hover:text-ink"
                >
                  <UserCircle2 size={14} />
                  Edit Profile
                </Link>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-rose-700 transition-colors hover:bg-rose-100/30 dark:hover:bg-rose-900/20"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}