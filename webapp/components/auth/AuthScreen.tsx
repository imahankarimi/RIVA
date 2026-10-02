"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { CurrencySelect, CurrencyLockWarning } from "@/components/settings/CurrencySelect";
import { useI18n } from "@/lib/i18n";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/app/providers";
import { defaultCurrencyFor, type BackendCurrency } from "@/lib/currency";

type Mode = "login" | "signup";

export function AuthScreen() {
  const { t, locale, setLocale } = useI18n();
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (mode === "signup" && password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const response =
        mode === "login" ? await login(email, password) : await signup(email, password, businessName, baseCurrency);
      setLocale(response.business.language);
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

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-10">
      <div className="pointer-events-none absolute -start-28 top-0 h-72 w-72 rounded-full bg-signal-100/70 blur-3xl" />
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl bg-card shadow-raised ring-1 ring-line animate-pop-in md:grid-cols-[1.05fr_.95fr]">
        {/* Branding panel */}
        <section className="hidden bg-signal-700 p-10 text-white md:flex md:flex-col md:justify-between">
          <div className="relative h-8 w-28">
            <Image src="/brand/riva-logo.svg" alt="RIVA" fill priority sizes="112px" className="object-contain object-left dark:hidden" />
            <Image src="/brand/riva-logo.svg" alt="RIVA" fill priority sizes="112px" className="hidden object-contain object-left dark:block" />
          </div>
          <div className="mt-auto space-y-4">
            <p className="font-display text-[28px] font-bold leading-tight tracking-tight text-white dark:text-[#101C2C]">{t("auth.welcome")}</p>
            <p className="max-w-[260px] text-[14px] leading-6 text-white/80 dark:text-[#101C2C]/80">{t("auth.welcomeBody")}</p>
            <div className="mt-6 h-px w-12 bg-white/20" />
          </div>
          <div className="mt-6 text-[11px] font-medium uppercase tracking-widest text-white/30 dark:text-[#101C2C]/30">RIVA AI</div>
        </section>

        {/* Form panel */}
        <section className="p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-signal-500 text-white"><Sparkle size={16} /></span>
            <span className="font-display font-bold text-ink">RIVA AI</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-ink">
            {mode === "login" ? t("auth.login") : t("auth.signup")}
          </h1>
          <p className="mt-2 text-[13.5px] text-ink-soft">
            {mode === "login" ? t("auth.welcomeBody") : t("auth.welcome")}
          </p>

          <form className="mt-7 space-y-4" onSubmit={submit}>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">{t("auth.email")}</Label>
              <Input id="auth-email" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="auth-biz">{t("auth.businessName")}</Label>
                  <Input id="auth-biz" required minLength={1} maxLength={255} autoComplete="organization" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <CurrencySelect value={baseCurrency} onChange={setBaseCurrency} label={t("settings.baseCurrency")} />
                <CurrencyLockWarning title={t("settings.currencyChooseCarefullyTitle")} body={t("settings.currencyChooseCarefullyBody")} />
              </>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="auth-pw">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="auth-pw"
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pe-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint hover:text-ink transition-colors"
                  aria-label={showPassword ? t("common.on") : t("common.off")}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-pw2">{t("auth.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="auth-pw2"
                    required
                    minLength={8}
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pe-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint hover:text-ink transition-colors"
                    aria-label={showConfirm ? t("common.on") : t("common.off")}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">{error}</Alert>
            )}

            {/* Submit */}
            <Button className="w-full" type="submit" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <>
                  {mode === "login" ? t("auth.loginAction") : t("auth.signupAction")}
                  <ArrowRight size={17} className="flip-rtl" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-[13px] text-ink-soft">
            {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
            <button type="button" onClick={switchMode} className="font-semibold text-signal-700 hover:text-signal-500 transition-colors">
              {mode === "login" ? t("auth.signup") : t("auth.login")}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}
