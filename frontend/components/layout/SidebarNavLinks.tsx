"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  primaryNavItems,
  insightNavItems,
  planningNavItems,
  supportNavItems,
  advisorNavItems,
} from "./nav-items";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  DURATION,
  EASE_OUT,
  SPRING_SNAPPY,
} from "@/lib/motion/tokens";

type NavItem =
  | (typeof primaryNavItems)[number]
  | (typeof insightNavItems)[number]
  | (typeof planningNavItems)[number]
  | (typeof supportNavItems)[number]
  | (typeof advisorNavItems)[number];

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  const active =
    pathname === item.href || pathname?.startsWith(`${item.href}/`);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "glass-lens group relative flex h-9 items-center gap-2.5 rounded-md px-3 text-[13px] font-medium",
        "transition-all duration-180",
        collapsed && "justify-center px-0",
        active
          ? "border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground shadow-subtle"
          : "border border-transparent text-ink-soft hover:border-line/50 hover:text-ink"
      )}
    >
      <Icon
        size={16}
        strokeWidth={2}
        className={cn(
          "relative z-10 shrink-0 transition-colors duration-180",
          active
            ? "text-sidebar-accent-foreground"
            : "text-ink-faint group-hover:text-ink"
        )}
      />

      <motion.span
        initial={{
          display: collapsed ? "none" : "inline-block",
          opacity: collapsed ? 0 : 1,
        }}
        animate={{
          display: collapsed ? "none" : "inline-block",
          opacity: collapsed ? 0 : 1,
        }}
        transition={{ duration: DURATION.base, ease: EASE_OUT }}
        className="relative z-10 whitespace-pre !p-0 !m-0 text-[13px] font-medium"
      >
        {t(item.labelKey)}
      </motion.span>
    </Link>
  );
}

function NavSection({
  label,
  items,
  collapsed,
  onNavigate,
}: {
  label: string;
  items: readonly NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <section className="mb-4">
      <div className="mb-1 flex h-[18px] overflow-hidden px-3 pt-1">
        <motion.span
          initial={{
            display: collapsed ? "none" : "inline-block",
            opacity: collapsed ? 0 : 1,
          }}
          animate={{
            display: collapsed ? "none" : "inline-block",
            opacity: collapsed ? 0 : 1,
          }}
          transition={{ duration: DURATION.base, ease: EASE_OUT }}
          className="whitespace-pre !p-0 !m-0 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint"
        >
          {label}
        </motion.span>
      </div>

      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}

export function SidebarNavLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();

  return (
    <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-3">
      <NavSection
        label={t("sidebar.workspace")}
        items={primaryNavItems}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      <NavSection
        label={t("sidebar.insights")}
        items={insightNavItems}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      <NavSection
        label={t("sidebar.intelligence")}
        items={advisorNavItems}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      <NavSection
        label={t("sidebar.planning")}
        items={planningNavItems}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      <NavSection
        label={t("sidebar.support")}
        items={supportNavItems}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    </nav>
  );
}