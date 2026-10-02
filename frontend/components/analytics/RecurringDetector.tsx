"use client";

import { useMemo, useState } from "react";
import { Repeat, CheckCircle2, Flag as FlagGlyph, CircleDashed } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatDate, type BackendCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { Recurring } from "@/lib/analytics";

type ChargeFlag = "neutral" | "keep" | "review";
const CYCLE: ChargeFlag[] = ["neutral", "keep", "review"];

function nextFlag(f: ChargeFlag): ChargeFlag {
  const idx = CYCLE.indexOf(f);
  return CYCLE[(idx + 1) % CYCLE.length]!;
}

function FlagIcon({ flag }: { flag: ChargeFlag }) {
  switch (flag) {
    case "keep":
      return <CheckCircle2 className="size-4 text-moss-500" />;
    case "review":
      return <FlagGlyph className="size-4 text-amber-500" />;
    default:
      return <CircleDashed className="size-4 text-ink-faint/50" />;
  }
}

function frequencyReaching(months: string[], t: (k: string, vars?: Record<string, string | number>) => string): string {
  if (months.length >= 2) {
    return t("analytics.monthly");
  }
  return t("analytics.everyMonth", { n: months.length });
}

export function RecurringDetector({
  recurring,
  currency,
}: {
  recurring: Recurring[];
  currency: BackendCurrency;
}) {
  const { t, locale } = useI18n();

  const [flags, setFlags] = useState<Record<string, ChargeFlag>>(() =>
    Object.fromEntries(recurring.map((r) => [r.item.id, "neutral" as ChargeFlag]))
  );

  const monthlyTotal = useMemo(
    () =>
      recurring.reduce((s, r) => {
        const item = r.item;
        if (item && Number.isFinite(item.amount)) return s + Math.abs(item.amount);
        return s;
      }, 0),
    [recurring]
  );

  const summary = useMemo(() => {
    let keep = 0;
    let review = 0;
    Object.values(flags).forEach((f) => {
      if (f === "keep") keep++;
      if (f === "review") review++;
    });
    return { keep, review };
  }, [flags]);

  function toggle(id: string) {
    setFlags((prev) => ({ ...prev, [id]: nextFlag(prev[id] ?? "neutral") }));
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-2 border-b border-line-soft px-5 py-4">
        <div>
          <h3 className="font-display text-[14.5px] font-bold text-ink">
            {t("analytics.recurringCharges")}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-ink-soft">
            <span className="font-mono font-figures font-semibold text-ink">
              {formatCurrency(monthlyTotal, currency, locale)}
            </span>
            {t("analytics.perMonthTotal")}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-signal-100 px-2 py-0.5 text-[11px] font-medium text-signal-700">
          <Repeat className="size-3" />
          {recurring.length}
        </span>
      </div>

      <div className="px-2 py-2 sm:px-2">
        {recurring.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Repeat className="mx-auto size-6 text-ink-faint/60" />
            <p className="mt-2 text-[13px] font-medium text-ink">
              {t("analytics.emptyRecurringTitle")}
            </p>
            <p className="mt-1 text-[12px] text-ink-soft">
              {t("analytics.emptyRecurringBody")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line-soft px-1">
            {recurring.map((r) => {
              const id = r.item.id;
              const flag = flags[id] ?? "neutral";
              return (
                <div
                  key={id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surfaceMuted/60"
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-signal-100 text-signal-700">
                    <Repeat className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {r.item.description}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-ink-soft">
                      {t("analytics.nextOn", {
                        date: formatDate(r.item.date, locale),
                      })}
                    </p>
                  </div>
                  <div className="mr-1 text-right">
                    <p className="text-[13px] font-medium tabular-nums text-ink">
                      {formatCurrency(Math.abs(r.item.amount), currency, locale)}
                    </p>
                    <p className="text-[10.5px] capitalize text-ink-faint">
                      {frequencyReaching(r.months, t)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="rounded-full p-1 transition-colors hover:bg-surfaceMuted"
                    aria-label={`Toggle flag for ${r.item.description}`}
                    title={
                      flag === "keep"
                        ? t("analytics.keep")
                        : flag === "review"
                          ? t("analytics.flag")
                          : t("analytics.neutral")
                    }
                  >
                    <FlagIcon flag={flag} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {recurring.length > 0 && (
        <div className="flex items-center justify-between border-t border-line-soft px-5 py-3 text-[11.5px] text-ink-soft">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-moss-500" />
            {t("analytics.keptCount", { n: String(summary.keep) })}
          </span>
          <span className="flex items-center gap-1.5">
            <FlagGlyph className="size-3.5 text-amber-500" />
            {t("analytics.reviewCount", { n: String(summary.review) })}
          </span>
        </div>
      )}
    </Card>
  );
}