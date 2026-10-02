"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, type BackendCurrency } from "@/lib/currency";

/**
 * Shared demo-state primitives.
 *
 * These render realistic previews for screens that don't yet have a
 * backend (Goals, Debts, Subscriptions). All data passed in is demo data —
 * swap the props for real API data later without touching this file.
 */

export function DemoNotice({ text }: { text: string }) {
  return <Alert variant="warning">{text}</Alert>;
}

/** A savings/plan goal card with an animated progress ring. */
export function GoalCard({
  name,
  icon,
  current,
  target,
  monthly,
  deadline,
  currency,
}: {
  name: string;
  icon: string;
  current: number;
  target: number;
  monthly: number;
  deadline: string;
  currency: BackendCurrency;
}) {
  const { locale, t } = useI18n();
  const percent = Math.round((current / target) * 100);
  return (
    <Card className="col-span-full">
      <CardContent>
        <div className="flex items-center gap-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-2xl">{icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <Badge variant="success" className="text-[10px]">{t("demo.onTrack")}</Badge>
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {formatCurrency(current, currency, locale)}
              <span className="text-sm font-normal text-muted-foreground"> / {formatCurrency(target, currency, locale)}</span>
            </p>
            <Progress value={percent} className="mt-2 h-2" />
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{formatCurrency(monthly, currency, locale)}/mo</span>
              <span>{t("demo.targetBy")} {deadline}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** A recurring subscription row. */
export function RecurringRow({
  name,
  amount,
  cadence,
  nextOn,
  currency,
}: {
  name: string;
  amount: number;
  cadence: string;
  nextOn: string;
  currency: BackendCurrency;
}) {
  const { locale, t } = useI18n();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line p-3 transition-colors hover:bg-muted/40">
      <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-base">🔄</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-[11px] text-muted-foreground">{cadence} · {t("demo.nextOn")} {nextOn}</p>
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(amount, currency, locale)}</span>
    </div>
  );
}