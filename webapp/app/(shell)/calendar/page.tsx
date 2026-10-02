"use client";

import { motion } from "framer-motion";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { CalendarDemo } from "@/components/calendar/CalendarDemo";
import { Alert } from "@/components/ui/Alert";
import { Calendar as CalendarIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function CalendarPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader eyebrow={t("nav.calendar")} title={t("nav.calendar")} icon={CalendarIcon} />

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <Alert variant="warning">{t("calendar.demoNotice")}</Alert>
        <CalendarDemo />
      </motion.div>
    </div>
  );
}