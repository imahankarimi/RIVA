"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronsUpDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings as SettingsIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useBusiness, useAuth } from "@/app/providers";
import { useAddIncome } from "@/components/transactions/AddIncomeContext";
import { cn } from "@/lib/utils";
import {
  DURATION,
  EASE_OUT,
  SPRING_SOFT,
} from "@/lib/motion/tokens";
import { GLASS } from "@/components/webapp/glass";
import {
  primaryNavItems,
  insightNavItems,
  planningNavItems,
  supportNavItems,
} from "./nav-items";

type NavItem =
  | (typeof primaryNavItems)[number]
  | (typeof insightNavItems)[number]
  | (typeof planningNavItems)[number]
  | (typeof supportNavItems)[number];

function NavLink({
  item,
  collapsed,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  const active =
    pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium",
        "transition-colors duration-150",
        collapsed && "justify-center px-0",
        active
          ? "text-deep-ink dark:text-warm-white"
          : "text-deep-ink/60 hover:bg-white/50 hover:text-deep-ink dark:text-warm-white/60 dark:hover:bg-white/10 dark:hover:text-warm-white"
      )}
    >
      {active && (
        <motion.span
          layoutId="webapp-sidebar-active-pill"
          transition={SPRING_SOFT}
          className="absolute inset-0 rounded-lg bg-white/70 shadow-sm dark:bg-white/15"
        />
      )}

      <Icon
        size={16}
        strokeWidth={2}
        className={cn(
          "relative shrink-0 transition-colors duration-150",
          active
            ? "text-signal-600"
            : "text-deep-ink/50 group-hover:text-deep-ink dark:text-warm-white/50 dark:group-hover:text-warm-white"
        )}
      />

      {!collapsed && (
        <span className="relative whitespace-pre text-[13px] font-medium">
          {t(item.labelKey)}
        </span>
      )}
    </Link>
  );
}

function NavSection({
  label,
  items,
  collapsed,
  pathname,
  onNavigate,
}: {
  label: string;
  items: readonly NavItem[];
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <section className="mb-4">
      <div className={cn("mb-1 flex h-[18px] overflow-hidden px-3 pt-1", collapsed && "justify-center px-0")}>
        {!collapsed && (
          <span className="whitespace-pre text-[10.5px] font-semibold uppercase tracking-[0.08em] text-deep-ink/40 dark:text-warm-white/40">
            {label}
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}

export function WebappSidebar() {
  const { t } = useI18n();
  const { business, businesses, setBusinessId } = useBusiness();
  const { user, logout } = useAuth();
  const { openAddIncome } = useAddIncome();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ")
    : "";

  const initial = (displayName || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={SPRING_SOFT}
      className="relative hidden h-full shrink-0 flex-col overflow-hidden md:flex"
    >
      <div className={cn(
        "m-3 flex h-[calc(100vh-1.5rem)] w-auto flex-col overflow-hidden rounded-2xl",
        GLASS.light.nav,
        GLASS.light.glow,
        "relative"
      )}>
        {/* RIVA brand */}
        <div
          className={cn(
            "relative flex h-16 shrink-0 items-center px-5",
            collapsed && "justify-center px-0"
          )}
        >
          <Link
            href="/home"
            aria-label="RIVA"
            className="flex shrink-0 items-center"
          >
            {collapsed ? (
              <span className="relative block h-9 w-9">
                <Image
                  src="/brand/riva-mark.svg"
                  alt="RIVA"
                  fill
                  priority
                  sizes="36px"
                  className="object-contain dark:hidden"
                />
                <Image
                  src="/brand/riva-mark-dark.svg"
                  alt="RIVA"
                  fill
                  priority
                  sizes="36px"
                  className="hidden object-contain dark:block"
                />
              </span>
            ) : (
              <span className="relative block h-9 w-[108px]">
                <Image
                  src="/brand/riva-logo.svg"
                  alt="RIVA"
                  fill
                  priority
                  sizes="108px"
                  className="object-contain object-left dark:hidden"
                />
                <Image
                  src="/brand/riva-logo-dark.svg"
                  alt="RIVA"
                  fill
                  priority
                  sizes="108px"
                  className="hidden object-contain object-left dark:block"
                />
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
          <NavSection
            label={t("sidebar.workspace")}
            items={primaryNavItems}
            collapsed={collapsed}
            pathname={pathname}
          />
          <NavSection
            label={t("sidebar.insights")}
            items={insightNavItems}
            collapsed={collapsed}
            pathname={pathname}
          />
          <NavSection
            label={t("sidebar.planning")}
            items={planningNavItems}
            collapsed={collapsed}
            pathname={pathname}
          />
          <NavSection
            label={t("sidebar.support")}
            items={supportNavItems}
            collapsed={collapsed}
            pathname={pathname}
          />
        </nav>

        {/* Quick actions */}
        <div className="relative shrink-0 border-t border-line/40 px-3 py-2">
          <div className={cn("mb-1 flex h-[18px] overflow-hidden px-3", collapsed && "justify-center px-0")}>
            {!collapsed && (
              <span className="whitespace-pre text-[10.5px] font-semibold uppercase tracking-[0.08em] text-deep-ink/40 dark:text-warm-white/40">
                {t("sidebar.quickActions")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={openAddIncome}
            title={collapsed ? t("sidebar.addTransaction") : undefined}
            className={cn(
              "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-deep-ink/70 transition-colors duration-150 hover:bg-white/60 hover:text-deep-ink dark:text-warm-white/70 dark:hover:bg-white/15 dark:hover:text-warm-white",
              collapsed && "justify-center px-0"
            )}
          >
            <Plus size={15} strokeWidth={2.2} className="relative shrink-0 text-signal-600" />
            {!collapsed && <span className="relative">{t("sidebar.addTransaction")}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <div className="relative shrink-0 border-t border-line/40 px-3 py-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-deep-ink/60 transition-colors duration-150 hover:bg-white/50 hover:text-deep-ink dark:text-warm-white/60 dark:hover:bg-white/10 dark:hover:text-warm-white",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} className="relative shrink-0" />
            ) : (
              <>
                <PanelLeftClose size={16} className="relative shrink-0" />
                <span className="relative">{t("sidebar.collapse")}</span>
              </>
            )}
          </button>
        </div>

        <div className="relative shrink-0 border-t border-line/40 p-3">
          {/* Business switcher */}
          <button
            onClick={() => {
              if (collapsed || businesses.length < 2) return;
              const currentIndex = businesses.findIndex(
                (b) => b.id === business.id
              );
              const next = businesses[(currentIndex + 1) % businesses.length];
              if (next) setBusinessId(next.id);
            }}
            title={collapsed ? business.name : undefined}
            className={cn(
              "relative mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition-colors duration-150 hover:bg-white/50 dark:hover:bg-white/10",
              collapsed && "justify-center px-0"
            )}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/40 text-xs font-semibold text-deep-ink dark:bg-white/15 dark:text-warm-white">
              {business.name.charAt(0)}
            </div>

            {!collapsed && (
              <span className="relative min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-deep-ink dark:text-warm-white">
                  {business.name}
                </span>
                <span className="block truncate text-[11.5px] text-deep-ink/60 dark:text-warm-white/60">
                  {business.currency}
                </span>
              </span>
            )}

            {!collapsed && businesses.length > 1 && (
              <ChevronsUpDown size={14} className="relative text-deep-ink/40 dark:text-warm-white/40" />
            )}
          </button>

          {/* Profile / account */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                onBlur={() => setTimeout(() => setAccountOpen(false), 120)}
                className={cn(
                  "relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition-colors duration-150 hover:bg-white/50 dark:hover:bg-white/10",
                  collapsed && "justify-center px-0"
                )}
                aria-label={t("common.accountMenu")}
              >
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/40 text-xs font-semibold text-deep-ink dark:bg-white/15 dark:text-warm-white">
                  {initial}
                </div>

                {!collapsed && (
                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-deep-ink dark:text-warm-white">
                      {displayName || user.email}
                    </span>
                    <span className="block truncate text-[11px] text-deep-ink/60 dark:text-warm-white/60">
                      {user.email}
                    </span>
                  </span>
                )}
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={SPRING_SOFT}
                    className="absolute bottom-full start-0 z-50 mb-2 w-56 overflow-hidden rounded-xl border border-white/50 bg-white/80 py-1 shadow-raised backdrop-blur-xl dark:border-white/10 dark:bg-surface/80"
                  >
                    <Link
                      href="/settings"
                      onMouseDown={() => setAccountOpen(false)}
                      className="relative flex items-center gap-2 px-3 py-2 text-[13px] text-deep-ink/70 transition-colors duration-150 hover:bg-white/60 hover:text-deep-ink dark:text-warm-white/70 dark:hover:bg-white/10 dark:hover:text-warm-white"
                    >
                      <SettingsIcon size={14} />
                      {t("profile.editProfile")}
                    </Link>

                    <button
                      onMouseDown={handleLogout}
                      className="relative flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-rose-700 transition-colors duration-150 hover:bg-rose-100/50 dark:text-rose-400 dark:hover:bg-rose-900/30"
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