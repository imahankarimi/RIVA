"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Sparkle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ApiError } from "@/lib/api/client";
import { requestPasswordReset } from "@/lib/api/auth";
import { useAuth } from "@/app/providers";
import { defaultCurrencyFor, type BackendCurrency } from "@/lib/currency";
import { CurrencySelect, CurrencyLockWarning } from "@/components/settings/CurrencySelect";

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
      router.replace("/overview");
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

      {/* Glass panel container */}
      <div className="liquid-glass-stage">
        {/* Brand header */}
        <section className="liquid-glass-intro">
          <div className="liquid-glass-mark">
            <Sparkle size={20} strokeWidth={2.5} className="text-white" />
          </div>
          <h1 className="liquid-glass-title">
            {mode === "login" ? t("auth.login") : mode === "signup" ? t("auth.signup") : t("auth.forgotTitle")}
          </h1>
          <p className="liquid-glass-subtitle">
            {mode === "login" ? t("auth.welcomeBody") : mode === "signup" ? t("auth.signupSubtitle") : t("auth.forgotBody")}
          </p>
        </section>

        {/* Forgot password success state */}
        {mode === "forgot" && forgotSent ? (
          <div className="space-y-6">
            <div className="liquid-glass-success-message">
              {t("auth.forgotSentGeneric")}
            </div>
            <button
              type="button"
              onClick={backToLogin}
              className="liquid-glass-button glass-lens w-full"
            >
              {t("auth.backToLogin")}
            </button>
          </div>
        ) : (
          <form className="liquid-glass-form" onSubmit={submit}>
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
                      className="liquid-glass-input pe-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                      aria-label={showPassword ? t("common.off") : t("common.on")}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                      className="liquid-glass-input pe-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                      aria-label={showConfirm ? t("common.off") : t("common.on")}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
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

            {/* Privacy note */}
            <p className="liquid-glass-privacy-note">
              {t("auth.privacyNote")}
            </p>

            {/* Submit button */}
            <div className="liquid-glass-actions">
              <button
                type="submit"
                disabled={loading}
                className="liquid-glass-button glass-lens"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? t("auth.loginAction") : mode === "signup" ? t("auth.signupAction") : t("auth.forgotAction")}
                    {mode !== "forgot" && <ArrowRight size={18} className="flip-rtl ms-2" />}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer actions */}
        <div className="liquid-glass-footer">
          {mode === "forgot" ? (
            <button
              type="button"
              onClick={backToLogin}
              className="liquid-glass-link"
            >
              {t("auth.backToLogin")}
            </button>
          ) : (
            <>
              <p className="text-white/60 text-[13px]">
                {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="liquid-glass-link"
                >
                  {mode === "login" ? t("auth.signup") : t("auth.login")}
                </button>
              </p>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={goToForgot}
                  className="liquid-glass-link text-[13px]"
                >
                  {t("auth.forgotPassword")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
