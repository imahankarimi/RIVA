"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useI18n } from "@/lib/i18n";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

function ResetPasswordInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-10">
        <div className="pointer-events-none absolute -start-28 top-0 h-72 w-72 rounded-full bg-signal-100/70 blur-3xl" />
        <div className="relative w-full max-w-md space-y-6 rounded-2xl bg-card p-8 shadow-raised ring-1 ring-line animate-pop-in">
          <div className="space-y-2 text-center">
            <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
              {t("auth.resetTitle")}
            </h1>
          </div>
          <div className="space-y-4">
            <Alert variant="destructive">{t("auth.resetInvalidToken")}</Alert>
            <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
              {t("auth.goToLogin")}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (reason) {
      if (reason instanceof ApiError) {
        setError(reason.message || t("auth.resetInvalidToken"));
      } else {
        setError(t("auth.unknownError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-10">
      <div className="pointer-events-none absolute -start-28 top-0 h-72 w-72 rounded-full bg-signal-100/70 blur-3xl" />
      <div className="relative w-full max-w-md space-y-6 rounded-2xl bg-card p-8 shadow-raised ring-1 ring-line animate-pop-in">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
            {t("auth.resetTitle")}
          </h1>
        </div>

        {done ? (
          <div className="space-y-4">
            <Alert variant="success">{t("auth.resetSuccess")}</Alert>
            <Button className="w-full" onClick={() => router.push("/login")}>
              {t("auth.goToLogin")}
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="reset-pw">{t("auth.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="reset-pw"
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pe-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint hover:text-ink transition-colors"
                  aria-label={showPassword ? t("common.off") : t("common.on")}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reset-pw2">{t("auth.confirmPassword")}</Label>
              <Input
                id="reset-pw2"
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && <Alert variant="destructive">{error}</Alert>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 size={17} className="animate-spin" /> : t("auth.resetAction")}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
