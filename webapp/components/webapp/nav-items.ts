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
} from "lucide-react";

export const primaryNavItems = [
  { href: "/home", labelKey: "nav.overview", icon: LayoutGrid },
  { href: "/assistant", labelKey: "nav.assistant", icon: Sparkles },
  { href: "/cash", labelKey: "nav.transactions", icon: ArrowLeftRight },
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

export const navItems = [
  ...primaryNavItems,
  ...insightNavItems,
  ...planningNavItems,
  ...supportNavItems,
] as const;