"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/app/providers";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

export function ProfileSetupModal() {
  const { t } = useI18n();
  const { needsProfileSetup, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await updateProfile(firstName.trim(), lastName.trim());
    } catch {
      setError(t("common.retry"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {needsProfileSetup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base }}
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("profile.setupTitle")}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: DURATION.moderate, ease: EASE_OUT }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface p-6 shadow-raised"
          >
            <motion.div
              initial={{ scale: 0.7, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-500 text-onSignal shadow-raised"
            >
              <Sparkle size={22} strokeWidth={2.2} />
            </motion.div>

            <h2 className="mt-4 text-center font-display text-[18px] font-bold text-ink">
              {t("profile.setupTitle")}
            </h2>
            <p className="mx-auto mt-1.5 max-w-xs text-center text-[13px] text-ink-faint">{t("profile.setupBody")}</p>

            <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
              <div className="space-y-2">
                <Label htmlFor="setup-first">{t("profile.firstName")}</Label>
                <Input
                  id="setup-first"
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("profile.firstNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-last">{t("profile.lastName")}</Label>
                <Input
                  id="setup-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("profile.lastNamePlaceholder")}
                />
              </div>

              {error && <Alert variant="destructive">{error}</Alert>}

              <Button
                type="submit"
                variant="primary"
                className="mt-1 w-full"
                disabled={saving || !firstName.trim() || !lastName.trim()}
              >
                {t("profile.save")}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
