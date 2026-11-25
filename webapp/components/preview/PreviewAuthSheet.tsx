"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { useI18n } from "@/lib/i18n";
import { usePreview } from "./PreviewProvider";

/**
 * Contextual authentication, presented as a mobile bottom sheet.
 *
 * It reuses the existing AuthScreen (same form, validation, API calls, Google
 * placeholder, password recovery) — only the presentation frame is new. The
 * guest never leaves the section they were exploring.
 */
export function PreviewAuthSheet() {
  const { t } = useI18n();
  const { authPrompt, closeAuthPrompt, completeAuthPrompt } = usePreview();
  const reduceMotion = useReducedMotion();
  const open = Boolean(authPrompt);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAuthPrompt();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, closeAuthPrompt]);

  const reason = t(authPrompt?.reasonKey ?? "preview.signInToContinue");

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-6">
          <motion.button
            type="button"
            aria-label={t("common.close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => closeAuthPrompt()}
            className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("preview.authTitle")}
            initial={reduceMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="liquid-glass-auth-sheet relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] shadow-raised md:max-h-[88vh] md:rounded-[28px]"
          >
            <div className="relative z-20 flex h-11 shrink-0 items-center justify-center px-4">
              <span aria-hidden className="h-1.5 w-12 rounded-full bg-warm-white/25 md:hidden" />
              <button
                type="button"
                onClick={() => closeAuthPrompt()}
                aria-label={t("common.close")}
                className="absolute end-3 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-warm-white/10 text-warm-white/70 transition-colors hover:bg-warm-white/15 hover:text-warm-white"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <AuthScreen
                embedded
                initialMode={authPrompt?.mode ?? "login"}
                contextNote={reason}
                onSuccess={completeAuthPrompt}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
