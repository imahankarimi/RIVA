"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Shield, Car, Home, Target } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import type { DemoSavingsGoal } from "./demoData";
import type { BackendCurrency } from "@/lib/currency";

const iconMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  shield: Shield,
  car: Car,
  home: Home,
  target: Target,
};

/** Savings Goals — ported from the reference Savings Goals widget (demo data). */
export function SavingsGoals({ goals, currency }: { goals: DemoSavingsGoal[]; currency: BackendCurrency }) {
  const { locale, t } = useI18n();

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("budgets.savingsGoals")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const percent = Math.round((g.currentAmount / g.targetAmount) * 100);
            const monthsLeft = Math.ceil((g.targetAmount - g.currentAmount) / g.monthlyContribution);
            const projectedDate = new Date();
            projectedDate.setMonth(projectedDate.getMonth() + monthsLeft);
            const deadlineDate = new Date(g.deadline + "-01");
            const onTrack = projectedDate <= deadlineDate;
            const Icon = iconMap[g.iconName] ?? Target;

            return (
              <div key={g.id} className="flex gap-4 rounded-xl border border-line p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-5" strokeWidth={1.8} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{g.name}</p>
                    <Badge className="text-[10px]">{onTrack ? t("budgets.onTrack") : t("budgets.behind")}</Badge>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      {formatCurrency(g.currentAmount, currency, locale)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {formatCurrency(g.targetAmount, currency, locale)}
                    </span>
                  </div>
                  <Progress value={percent} className="h-2" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{formatCurrency(g.monthlyContribution, currency, locale)}/mo</span>
                    <span>{t("budgets.targetBy")} {g.deadline.replace("-", "/")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}