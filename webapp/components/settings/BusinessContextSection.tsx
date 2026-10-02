"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { getBusinessContext, updateBusinessContext } from "@/lib/api/businessContext";

export function BusinessContextSection() {
  const { t } = useI18n();
  const { business } = useBusiness();
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBusinessContext(business.id)
      .then((res) => {
        if (!cancelled) setContext(res.context ?? "");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [business.id]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateBusinessContext(business.id, context.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <motion.div
          initial={{ scale: 0.8, rotate: -6 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-500 text-onSignal"
        >
          <Sparkle size={18} strokeWidth={2.2} />
        </motion.div>
        <div className="min-w-0">
          <h3 className="font-display text-[15.5px] font-bold text-ink">{t("businessContext.title")}</h3>
          <p className="mt-1 text-[13px] leading-5 text-ink-faint">{t("businessContext.subtitle")}</p>
        </div>
      </div>

      <Textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder={t("businessContext.placeholder")}
        disabled={loading}
        rows={5}
        maxLength={4000}
        className="mt-4 px-3.5 py-3 text-[13.5px] leading-6"
      />

      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={loading || saving}>
          {saving ? t("addIncome.saving") : t("businessContext.save")}
        </Button>
        {saved && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12.5px] font-medium text-moss-700"
          >
            {t("businessContext.saved")}
          </motion.span>
        )}
      </div>
    </Card>
  );
}
