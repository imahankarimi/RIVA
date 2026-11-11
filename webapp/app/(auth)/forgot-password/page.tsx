"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t("auth.emailRequired"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest("/api/auth/request-password-reset", {
        method: "POST",
        body: { email: email.toLowerCase().trim() },
      });

      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset request error:", err);
      setError(err.message || t("auth.resetRequestFailed"));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-moss-100">
              <CheckCircle2 size={32} className="text-moss-700" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-ink">
              {t("auth.resetEmailSent")}
            </h1>
            <p className="mb-6 text-[14px] text-ink-soft">
              {t("auth.resetEmailSentDescription")}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-signal-600 hover:text-signal-700"
            >
              <ArrowLeft size={16} />
              {t("auth.backToLogin")}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="w-full max-w-md"
      >
        <div className="mb-6 text-center">
          <h1 className="mb-2 font-display text-3xl font-bold text-ink">
            {t("auth.forgotPassword")}
          </h1>
          <p className="text-[14px] text-ink-soft">
            {t("auth.forgotPasswordDescription")}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  size={18}
                />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder={t("auth.emailPlaceholder")}
                  disabled={loading}
                  autoComplete="email"
                  className="ps-10"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-rose-700/40 bg-rose-700 p-3 text-[13px] font-semibold text-white shadow-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-onSignal transition-all",
                loading || !email.trim()
                  ? "cursor-not-allowed bg-signal-300 opacity-60"
                  : "bg-signal-500 hover:bg-signal-600 active:scale-[0.98]"
              )}
            >
              {loading ? t("auth.sending") : t("auth.sendResetLink")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-signal-600 hover:text-signal-700"
            >
              <ArrowLeft size={16} />
              {t("auth.backToLogin")}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
