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
  { href: "/budgets", labelKey: "nav.budgets", icon: PiggyBank },
  { href: "/goals", labelKey: "nav.goals", icon: Target },
  { href: "/debts", labelKey: "nav.debts", icon: CreditCard },
  { href: "/subscriptions", labelKey: "nav.subscriptions", icon: RefreshCw },
  { href: "/calendar", labelKey: "nav.calendar", icon: Calendar },
] as const;

export const supportNavItems = [
  { href: "/help", labelKey: "nav.help", icon: LifeBuoy },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export const advisorNavItems = [
  { href: "/advisor", labelKey: "nav.advisor", icon: BrainCircuit },
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

export const mobileNavItems = [
  primaryNavItems[0],
  primaryNavItems[2],
  primaryNavItems[1],
  primaryNavItems[3],
  supportNavItems[1],
] as const;