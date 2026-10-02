"use client";
import { LifeBuoy } from "lucide-react";
import { ComingSoonPage } from "@/components/layout/ComingSoonPage";
import { useI18n } from "@/lib/i18n";

export default function HelpPage() {
  const { t } = useI18n();
  return <ComingSoonPage title={t("nav.help")} icon={LifeBuoy} descriptionKey="comingSoon.helpDesc" />;
}
