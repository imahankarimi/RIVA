"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  HeartPulse,
  Sparkles,
  Lightbulb,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/lib/i18n";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";

const sections = [
  {
    key: "health",
    icon: HeartPulse,
  },
  {
    key: "insights",
    icon: Sparkles,
  },
  {
    key: "recommendations",
    icon: Lightbulb,
  },
  {
    key: "forecasts",
    icon: TrendingUp,
  },
  {
    key: "reports",
    icon: FileText,
  },
] as const;

export default function AdvisorPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar
        title={t("advisor.title")}
        subtitle={t("advisor.subtitle")}
      />

      <main className="mx-auto w-full max-w-content flex-1 px-4 pb-10 pt-6 sm:px-6">
        <div className="space-y-6">
          {/* Page heading + phase tag */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-end justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-signal-500/10 text-signal-600">
                  <BrainCircuit size={18} />
                </div>
                <p className="text-[12.5px] font-medium text-ink-faint">
                  {t("advisor.title")}
                </p>
              </div>
              <h2 className="mt-1 font-display text-[21px] font-bold tracking-tight text-ink sm:text-[24px]">
                {t("nav.advisor")}
              </h2>
            </div>

            <Badge variant="default">{t("advisor.phaseTag")}</Badge>
          </motion.div>

          {/* Placeholder foundation cards */}
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {sections.map(({ key, icon: Icon }, index) => (
              <motion.div
                key={key}
                variants={staggerItem}
                className={index === 0 ? "sm:col-span-2 lg:col-span-1" : undefined}
              >
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-signal-500/10 text-signal-600">
                        <Icon size={16} />
                      </span>
                      {t(`advisor.${key}`)}
                    </CardTitle>
                    <CardAction />
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <p className="text-[12.5px] leading-relaxed text-ink-soft">
                      {t(`advisor.${key}Desc`)}
                    </p>

                    <div className="mt-auto rounded-lg border border-dashed border-line bg-surfaceMuted/40 px-3 py-2.5 text-[11.5px] text-ink-faint">
                      {t("advisor.comingSoon")}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}