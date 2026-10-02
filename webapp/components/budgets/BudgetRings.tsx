"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { motion } from "framer-motion";
import {
  Home,
  Users,
  ShoppingBag,
  Megaphone,
  Shield,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import type { DemoBudget } from "./demoData";
import type { BackendCurrency } from "@/lib/currency";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  users: Users,
  "shopping-bag": ShoppingBag,
  megaphone: Megaphone,
  shield: Shield,
  car: Car,
};

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Budget Rings — ported from the reference Budget Rings widget. */
export function BudgetRings({ budgets, currency }: { budgets: DemoBudget[]; currency: BackendCurrency }) {
  const { locale, t } = useI18n();

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("budgets.monthlyBudgets")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {budgets.map((b, i) => {
            const percent = Math.min((b.spent / b.budget) * 100, 100);
            const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
            const isOver = b.spent > b.budget;
            const Icon = iconMap[b.iconName] ?? Home;

            return (
              <div key={b.id} className="flex flex-col items-center gap-2">
                <div className="relative size-24">
                  <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                    <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="currentColor" className="text-muted" strokeWidth="8" />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r={RADIUS}
                      fill="none"
                      stroke="currentColor"
                      className={isOver ? "text-destructive" : b.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={CIRCUMFERENCE}
                      initial={{ strokeDashoffset: CIRCUMFERENCE }}
                      animate={{
                        strokeDashoffset: offset,
                        ...(isOver ? { scale: [1, 1.03, 1], opacity: [1, 0.8, 1] } : {}),
                      }}
                      transition={{
                        strokeDashoffset: { duration: 1, delay: i * 0.1, ease: "easeOut" },
                        scale: isOver ? { duration: 1.5, repeat: Infinity } : undefined,
                        opacity: isOver ? { duration: 1.5, repeat: Infinity } : undefined,
                      }}
                    />
                  </svg>
                  <div className={cn("absolute inset-0 flex items-center justify-center", isOver ? "text-destructive" : b.color)}>
                    <Icon className="size-5" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">{b.category}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatCurrency(b.spent, currency, locale)}{" "}
                    <span className="text-muted-foreground/60">/ {formatCurrency(b.budget, currency, locale)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}