"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { ApiError } from "@/lib/api/client";
import { requestPasswordReset } from "@/lib/api/auth";
import { useAuth } from "@/app/providers";
import { defaultCurrencyFor, type BackendCurrency } from "@/lib/currency";
import { CurrencySelect, CurrencyLockWarning } from "@/components/settings/CurrencySelect";
import { installLiquidLens } from "@/lib/liquidLens";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

type Mode = "login" | "signup" | "forgot";

export function AuthScreen() {
  const { t, locale } = useI18n();
  const { login, signup } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<BackendCurrency>(defaultCurrencyFor(locale));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    const cleanup = installLiquidLens();
    return cleanup;
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (mode === "forgot") {
      setLoading(true);
      try {
        await requestPasswordReset(email);
        setForgotSent(true);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : t("auth.unknownError"));
      } finally {
        setLoading(false);
      }
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const response =
        mode === "login" ? await login(email, password) : await signup(email, password, businessName, baseCurrency);
      router.replace("/home");
    } catch (reason) {
      if (reason instanceof ApiError) {
        setError(reason.message);
      } else if (reason instanceof TypeError && reason.message.includes('fetch')) {
        setError(t("auth.networkError"));
      } else {
        setError(reason instanceof Error ? reason.message : t("auth.unknownError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const goToForgot = () => {
    setMode("forgot");
    setError("");
    setForgotSent(false);
    setPassword("");
    setConfirmPassword("");
  };

  const backToLogin = () => {
    setMode("login");
    setError("");
    setForgotSent(false);
  };

  return (
    <main className="liquid-glass-auth-page">
      {/* Animated gradient background */}
      <div className="liquid-glass-bg">
        <div className="liquid-glass-gradient-1" />
        <div className="liquid-glass-gradient-2" />
        <div className="liquid-glass-gradient-3" />
      </div>

      <motion.div className="liquid-glass-stage" layout transition={{ duration: DURATION.moderate, ease: EASE_OUT }}>
        {/* Brand mark and heading */}
        <section className="liquid-glass-intro">
          <div className="relative h-10 w-auto mb-6">
            <Image
              src="/brand/riva-logo.svg"
              alt="RIVA"
              width={96}
              height={32}
              className="dark:hidden"
              priority
            />
            <Image
              src="/brand/riva-logo-dark.svg"
              alt="RIVA"
              width={96}
              height={32}
              className="hidden dark:block"
              priority
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
            >
              <h1 className="liquid-glass-title">
                {mode === "login" ? t("auth.login") : mode === "signup" ? t("auth.signup") : t("auth.forgotTitle")}
              </h1>
              <p className="liquid-glass-subtitle">
                {mode === "login" ? t("auth.welcomeBody") : mode === "signup" ? t("auth.signupSubtitle") : t("auth.forgotBody")}
              </p>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Form */}
        <AnimatePresence mode="wait">
          {mode === "forgot" && forgotSent ? (
            <motion.div
              key="forgot-sent"
              className="liquid-glass-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: DURATION.moderate, ease: EASE_OUT }}
            >
              <div className="liquid-glass-success-message">
                {t("auth.forgotSentGeneric")}
              </div>
              <button
                type="button"
                onClick={backToLogin}
                className="glass-lens liquid-glass-button w-full"
              >
                {t("auth.backToLogin")}
              </button>
            </motion.div>
          ) : (
            <motion.form
              key={mode}
              className="liquid-glass-form"
              onSubmit={submit}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: DURATION.moderate, ease: EASE_OUT }}
            >
            <div className="liquid-glass-fields">
              {/* Email */}
              <label className="liquid-glass-field">
                <span className="liquid-glass-field-label">{t("auth.email")}</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="liquid-glass-input"
                  placeholder={t("auth.emailPlaceholder")}
                />
              </label>

              {/* Business name (signup only) */}
              {mode === "signup" && (
                <label className="liquid-glass-field">
                  <span className="liquid-glass-field-label">{t("auth.businessName")}</span>
                  <input
                    type="text"
                    required
                    minLength={1}
                    maxLength={255}
                    autoComplete="organization"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="liquid-glass-input"
                    placeholder={t("auth.businessNamePlaceholder")}
                  />
                </label>
              )}

              {/* Currency (signup only) */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <CurrencySelect
                    value={baseCurrency}
                    onChange={setBaseCurrency}
                    label={t("settings.baseCurrency")}
                  />
                  <CurrencyLockWarning
                    title={t("settings.currencyChooseCarefullyTitle")}
                    body={t("settings.currencyChooseCarefullyBody")}
                  />
                </div>
              )}

              {/* Password */}
              {mode !== "forgot" && (
                <label className="liquid-glass-field">
                  <span className="liquid-glass-field-label">{t("auth.password")}</span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="liquid-glass-input pe-11"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      aria-label={showPassword ? t("common.off") : t("common.on")}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              )}

              {/* Confirm password (signup only) */}
              {mode === "signup" && (
                <label className="liquid-glass-field">
                  <span className="liquid-glass-field-label">{t("auth.confirmPassword")}</span>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="liquid-glass-input pe-11"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      aria-label={showConfirm ? t("common.off") : t("common.on")}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="liquid-glass-error">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="glass-lens liquid-glass-button w-full"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === "login" ? t("auth.loginAction") : mode === "signup" ? t("auth.signupAction") : t("auth.forgotAction")}
                  {mode !== "forgot" && <ArrowRight size={18} className="flip-rtl" />}
                </>
              )}
            </button>

            {/* Forgot password link (login only) */}
            {mode === "login" && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={goToForgot}
                  className="text-[13px] text-white/60 hover:text-white font-medium transition-colors"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
            )}
          </motion.form>
          )}
        </AnimatePresence>

        {/* Footer actions */}
        <div className="liquid-glass-footer">
          <AnimatePresence mode="wait">
            {mode === "forgot" && !forgotSent ? (
              <motion.button
                key="back-to-login"
                type="button"
                onClick={backToLogin}
                className="text-[13px] text-white/60 hover:text-white font-medium transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.base }}
              >
                {t("auth.backToLogin")}
              </motion.button>
            ) : mode !== "forgot" && (
              <motion.p
                key={mode === "login" ? "to-signup" : "to-login"}
                className="text-[13px] text-white/60 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.base }}
              >
                {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-white hover:text-white/90 font-semibold transition-colors"
                >
                  {mode === "login" ? t("auth.signup") : t("auth.login")}
                </button>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
