"use client";

import { Sparkle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Full-width notice shown on webapp content pages when the backend is a
 *  demo-data fallback. Reuses the existing demo-data copy. */
export function WebappNotice({
  variant,
  children,
}: {
  variant?: "demo" | "info";
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  if (variant !== "demo") return null;
  return (
    <div className="mb-5 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-100/50 px-4 py-2 text-[12px] font-medium text-amber-700">
      <Sparkle size={13} className="shrink-0" />
      <span>{children ?? t("common.demoDataNotice")}</span>
    </div>
  );
}