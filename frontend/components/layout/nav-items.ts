import {
  Sparkles,
  LayoutGrid,
  ArrowLeftRight,
  BookOpen,
  BarChart3,
  Settings,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  CreditCard,
  RefreshCw,
  Calendar,
  LifeBuoy,
  BrainCircuit,
} from "lucide-react";

export const primaryNavItems = [
  { href: "/overview", labelKey: "nav.overview", icon: LayoutGrid },
  { href: "/assistant", labelKey: "nav.assistant", icon: Sparkles },
  { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
  { href: "/accounts", labelKey: "nav.accounts", icon: BookOpen },
] as const;

export const insightNavItems = [
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { href: "/income", labelKey: "nav.income", icon: TrendingUp },
  { href: "/expenses", labelKey: "nav.expenses", icon: TrendingDown },
] as const;

export const planningNavItems = [
  { href: "/budgets", labelKey: "nav.budgets", icon: PiggyBank, soon: true },
  { href: "/goals", labelKey: "nav.goals", icon: Target, soon: true },
  { href: "/debts", labelKey: "nav.debts", icon: CreditCard, soon: true },
  { href: "/subscriptions", labelKey: "nav.subscriptions", icon: RefreshCw, soon: true },
  { href: "/calendar", labelKey: "nav.calendar", icon: Calendar },
] as const;

export const supportNavItems = [
  { href: "/help", labelKey: "nav.help", icon: LifeBuoy },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export const advisorNavItems = [
  { href: "/advisor", labelKey: "nav.advisor", icon: BrainCircuit, soon: true },
] as const;

/**
 * Kept for compatibility with existing components.
 * New sidebar rendering uses the grouped collections above.
 */
export const navItems = [
  ...primaryNavItems,
  ...insightNavItems,
  ...planningNavItems,
  ...supportNavItems,
] as const;

export const secondaryNavItems = [
  ...insightNavItems,
  ...planningNavItems,
  ...supportNavItems,
] as const;

/**
 * The five destinations shown in the floating mobile navigation bar.
 *
 * Design-system rules (docs/DESIGN_SYSTEM.md → Navigation):
 *   - Exactly five items. A sixth does not fit the width of a small phone at
 *     readable label size.
 *   - The RIVA Assistant MUST be the centre item and is flagged `hero: true`,
 *     which renders it as the raised, inverted focal tab.
 *   - This is the shortcut row only. Everything else — RIVA Advisor, Reports,
 *     Income, Expenses, Budgets, Goals, Debts, Subscriptions, Calendar, Help —
 *     is reached through `MobileNavDrawer`, which reuses the same grouped
 *     collections as the desktop sidebar so the two can never disagree.
 */
export const MOBILE_NAV = [
  { href: "/overview", labelKey: "nav.overview", icon: LayoutGrid, hero: false },
  { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight, hero: false },
  { href: "/assistant", labelKey: "nav.assistant", icon: Sparkles, hero: true },
  { href: "/accounts", labelKey: "nav.accounts", icon: BookOpen, hero: false },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, hero: false },
] as const;

/** @deprecated Use `MOBILE_NAV`. Retained so existing imports keep working. */
export const mobileNavItems = MOBILE_NAV;