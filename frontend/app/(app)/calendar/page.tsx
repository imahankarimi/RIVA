"use client";

import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { CalendarDemo } from "@/components/calendar/CalendarDemo";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n";

export default function CalendarPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title={t("nav.calendar")} />

      <main className="mx-auto w-full max-w-content flex-1 px-4 pb-10 pt-6 sm:px-6 xl:max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <Alert variant="warning">{t("calendar.demoNotice")}</Alert>
          <CalendarDemo />
        </motion.div>
      </main>
    </div>
  );
}