"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, User, Building2, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/providers";
import { useBusiness } from "@/app/providers";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { Glass, Menu } from "@/components/glisse";
import { CURRENCY_META } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { MenuEntry } from "@/components/glisse";

export function TopbarActions() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { business, businesses, setBusinessId } = useBusiness();
  const { resolved, toggle } = useTheme();
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const businessButtonRef = useRef<HTMLButtonElement>(null);
  const businessMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : "";

  // Close business menu when clicking outside
  useEffect(() => {
    if (!businessMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        businessButtonRef.current &&
        businessMenuRef.current &&
        !businessButtonRef.current.contains(e.target as Node) &&
        !businessMenuRef.current.contains(e.target as Node)
      ) {
        setBusinessMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [businessMenuOpen]);

  // Build profile menu items with proper handlers
  const profileMenuItems: MenuEntry[] = [
    {
      label: "Edit Profile",
      icon: <Settings size={16} strokeWidth={2} />,
      onSelect: () => {
        router.push("/settings");
      },
    },
    "separator",
    {
      label: "Log Out",
      icon: <LogOut size={16} strokeWidth={2} />,
      onSelect: () => {
        logout();
        router.push("/login");
      },
      destructive: true,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* ONE shared oval Glisse surface containing Theme + Business */}
      <Glass className="flex h-12 items-center gap-0.5 rounded-full px-0.5">
        {/* Theme Switcher */}
        <button
          onClick={toggle}
          aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "text-deep-ink dark:text-warm-white",
            "hover:bg-white/40 active:bg-white/60",
            "dark:hover:bg-white/10 dark:active:bg-white/20",
            "transition-colors duration-150"
          )}
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
              {resolved === "dark" ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* Business Switcher - show if user has businesses */}
        {businesses && businesses.length > 0 && (
          <div className="relative">
            <button
              ref={businessButtonRef}
              onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
              aria-label="Switch business"
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                "text-deep-ink dark:text-warm-white",
                "hover:bg-white/40 active:bg-white/60",
                "dark:hover:bg-white/10 dark:active:bg-white/20",
                "transition-colors duration-150"
              )}
            >
              <Building2 size={20} strokeWidth={2} />
            </button>

            {/* Business Menu Popup */}
            <AnimatePresence>
              {businessMenuOpen && (
                <motion.div
                  ref={businessMenuRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={cn(
                    "absolute end-0 top-[calc(100%+8px)] z-50 min-w-[200px] origin-top-end",
                    "overflow-hidden rounded-2xl",
                    "border border-white/[0.15] bg-white/[0.85] backdrop-blur-xl",
                    "dark:border-white/[0.08] dark:bg-[rgb(var(--c-surface))]/[0.85]",
                    "shadow-[0_8px_24px_-4px_rgba(16,28,44,0.12),0_2px_8px_-2px_rgba(16,28,44,0.08)]",
                    "dark:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4),0_2px_8px_-2px_rgba(0,0,0,0.2)]"
                  )}
                >
                  <div className="p-1.5">
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setBusinessId(b.id);
                          setBusinessMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-start",
                          "transition-colors duration-100",
                          b.id === business.id
                            ? "bg-black/[0.06] dark:bg-white/[0.08]"
                            : "hover:bg-black/[0.04] active:bg-black/[0.08] dark:hover:bg-white/[0.04] dark:active:bg-white/[0.08]"
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-signal-100 text-[11px] font-bold text-signal-700 dark:bg-signal-800/80 dark:text-signal-300">
                            {b.name.charAt(0)}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[13px] font-medium text-[rgb(var(--c-ink))] dark:text-[rgb(var(--c-warm-white))]">
                              {b.name}
                            </span>
                            <span className="text-[11px] text-[rgb(var(--c-ink-faint))]">
                              {CURRENCY_META[b.currency].flag} {b.currency}
                            </span>
                          </span>
                        </div>
                        {b.id === business.id && (
                          <span className="shrink-0 text-[14px] text-signal-600 dark:text-signal-400">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </Glass>

      {/* Profile Menu - ONE separate circular Glisse button */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center [&_button]:!h-12 [&_button]:!w-12 [&_button]:!min-h-[48px] [&_button]:!min-w-[48px] [&_button]:!rounded-full [&_[role='menuitem']]:whitespace-nowrap">
        <Menu
          items={profileMenuItems}
          aria-label="Profile menu"
          icon={<User size={20} strokeWidth={2} />}
          align="end"
          className="p-0"
        />
      </div>
    </div>
  );
}