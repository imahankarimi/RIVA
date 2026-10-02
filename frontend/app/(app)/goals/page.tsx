"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { GoalCard, DemoNotice } from "@/components/demo/DemoScreen";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";

const goalProjects = [
  { name: "Emergency Fund", icon: "🛡️", current: 8400, target: 12000, monthly: 800, deadline: "2026-12" },
  { name: "New Equipment", icon: "🏢", current: 3200, target: 6000, monthly: 500, deadline: "2026-11" },
  { name: "Expansion Reserve", icon: "🚀", current: 1500, target: 5000, monthly: 350, deadline: "2027-03" },
];

export default function GoalsPage() {
  const { t } = useI18n();
  const { business } = useBusiness();

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title={t("nav.goals")} />

      <main className="mx-auto w-full max-w-content flex-1 px-4 pb-10 pt-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <DemoNotice text={t("demo.goalsNotice")} />

          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-signal-100 text-signal-700">
              <Target className="size-4" />
            </span>
            <h2 className="font-display text-[18px] font-bold text-ink">{t("nav.goals")}</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {goalProjects.map((g) => (
              <GoalCard key={g.name} {...g} currency={business.currency} />
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}