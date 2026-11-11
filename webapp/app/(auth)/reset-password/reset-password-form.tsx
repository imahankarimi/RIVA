"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return t("auth.passwordTooShort");
    }
    if (!/[A-Z]/.test(pwd)) {
      return t("auth.passwordNeedsUppercase");
    }
    if (!/[a-z]/.test(pwd)) {
      return t("auth.passwordNeedsLowercase");
    }
    if (!/[0-9]/.test(pwd)) {
      return t("auth.passwordNeedsNumber");
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError(t("auth.invalidResetToken"));
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: {
          token,
          new_password: password,
        },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || t("auth.resetFailed"));
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
              <AlertCircle size={32} className="text-rose-700" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-ink">
              {t("auth.invalidResetToken")}
            </h1>
            <p className="mb-6 text-[14px] text-ink-soft">
              {t("auth.invalidResetTokenDescription")}
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center rounded-xl bg-signal-500 px-6 py-3 font-semibold text-onSignal hover:bg-signal-600"
            >
              {t("auth.requestNewLink")}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
              {t("auth.passwordResetSuccess")}
            </h1>
            <p className="mb-6 text-[14px] text-ink-soft">
              {t("auth.passwordResetSuccessDescription")}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-signal-500 px-6 py-3 font-semibold text-onSignal hover:bg-signal-600"
            >
              {t("auth.goToLogin")}
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
            {t("auth.resetPassword")}
          </h1>
          <p className="text-[14px] text-ink-soft">
            {t("auth.resetPasswordDescription")}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.newPassword")}</Label>
              <div className="relative">
                <Lock
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  size={18}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={t("auth.passwordPlaceholder")}
                  disabled={loading}
                  autoComplete="new-password"
                  className="pe-10 ps-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-[12px] text-ink-faint">
                {t("auth.passwordRequirements")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <div className="relative">
                <Lock
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  size={18}
                />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  disabled={loading}
                  autoComplete="new-password"
                  className="pe-10 ps-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                  aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
              disabled={loading || !password || !confirmPassword}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-onSignal transition-all",
                loading || !password || !confirmPassword
                  ? "cursor-not-allowed bg-signal-300 opacity-60"
                  : "bg-signal-500 hover:bg-signal-600 active:scale-[0.98]"
              )}
            >
              {loading ? t("auth.resetting") : t("auth.resetPassword")}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
