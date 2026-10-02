"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Calendar,
  CreditCard,
  LayoutGrid,
  LifeBuoy,
  PiggyBank,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { cn } from "@/lib/utils";

type CommandItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

const commands: CommandItem[] = [
  { href: "/overview", labelKey: "nav.overview", icon: LayoutGrid },
  { href: "/assistant", labelKey: "nav.assistant", icon: Sparkles },
  { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
  { href: "/accounts", labelKey: "nav.accounts", icon: BookOpen },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { href: "/income", labelKey: "nav.income", icon: TrendingUp },
  { href: "/expenses", labelKey: "nav.expenses", icon: TrendingDown },
  { href: "/budgets", labelKey: "nav.budgets", icon: PiggyBank },
  { href: "/goals", labelKey: "nav.goals", icon: Target },
  { href: "/debts", labelKey: "nav.debts", icon: CreditCard },
  { href: "/subscriptions", labelKey: "nav.subscriptions", icon: RefreshCw },
  { href: "/calendar", labelKey: "nav.calendar", icon: Calendar },
  { href: "/help", labelKey: "nav.help", icon: LifeBuoy },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function CommandPalette() {
  const router = useRouter();
  const { t } = useI18n();
  const { resolved, toggle } = useTheme();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = commands.filter((item) => {
    if (!normalizedQuery) return true;

    return t(item.labelKey).toLowerCase().includes(normalizedQuery);
  });

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function toggleTheme() {
    setOpen(false);
    toggle();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-ink/20 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          setOpen(false);
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-raised"
      >
        <div className="flex h-12 items-center gap-2 border-b border-line px-4">
          <Search size={17} className="shrink-0 text-ink-faint" />

          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("common.search")}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint"
          />

          <kbd className="hidden rounded border border-line bg-surfaceMuted px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[min(55vh,480px)] overflow-y-auto p-2">
          {filtered.length > 0 ? (
            <div className="space-y-0.5">
              {filtered.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start text-[13px] text-ink-soft transition-colors hover:bg-surfaceMuted hover:text-ink"
                  >
                    <Icon
                      size={16}
                      strokeWidth={2}
                      className="shrink-0 text-ink-faint"
                    />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-10 text-center">
              <p className="text-[13px] font-medium text-ink">
                {t("common.noResults")}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-3 py-2">
          <span className="text-[11px] text-ink-faint">
            {filtered.length} {t("common.results")}
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]",
              "text-ink-faint transition-colors hover:bg-surfaceMuted hover:text-ink"
            )}
          >
            {resolved === "dark" ? "☀" : "☾"}
            {resolved === "dark"
              ? t("common.switchToLight")
              : t("common.switchToDark")}
          </button>
        </div>
      </div>
    </div>
  );
}
