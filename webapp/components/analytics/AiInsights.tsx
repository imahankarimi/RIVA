"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/i18n/labels";
import type { InsightFact } from "@/lib/analytics";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function TrendIcon({ trend }: { trend: InsightFact["trend"] }) {
  switch (trend) {
    case "up":
      return <TrendingUp className="size-3" />;
    case "down":
      return <TrendingDown className="size-3" />;
    default:
      return <Minus className="size-3" />;
  }
}

export function AiInsights({
  facts,
}: {
  facts: InsightFact[];
}) {
  const { t } = useI18n();

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line-soft px-5 py-4">
        <Sparkles className="size-4 text-primary" />
        <h3 className="font-display text-[14.5px] font-bold text-ink">
          {t("analytics.aiInsights")}
        </h3>
        <span className="ms-auto text-[11px] text-ink-faint">
          {t("analytics.insightsByAssistant")}
        </span>
      </div>

      <div className="px-5 py-4">
        {facts.length === 0 ? (
          <p className="text-[13px] text-ink-soft">{t("analytics.noInsights")}</p>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-3"
          >
            {facts.map((insight, i) => (
              <motion.div
                key={insight.id}
                variants={item}
                className="flex gap-3 rounded-lg border border-line-soft bg-surfaceMuted/50 p-3"
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {i % 2 === 0 ? (
                    <Brain className="size-4 text-primary" />
                  ) : (
                    <Sparkles className="size-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[13px] leading-snug text-ink">
                    {insight.text}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {insight.percentChange !== null && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                          insight.trend === "up" &&
                            "bg-rose-100/70 text-rose-700",
                          insight.trend === "down" &&
                            "bg-moss-100/70 text-moss-700",
                          insight.trend === "neutral" &&
                            "bg-surfaceMuted text-ink-soft"
                        )}
                      >
                        <TrendIcon trend={insight.trend} />
                        {insight.trend === "neutral"
                          ? "—"
                          : `${insight.percentChange}%`}
                      </span>
                    )}
                    <span className="text-[11px] text-ink-faint">
                      {getCategoryLabel(insight.category, t)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Card>
  );
}