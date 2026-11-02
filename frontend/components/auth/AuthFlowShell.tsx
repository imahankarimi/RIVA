"use client";

import type { ReactNode } from "react";
import { Sparkle } from "lucide-react";

/** Centered shell for the public auth-flow pages (verify-email, reset-password).
 *  Mirrors AuthScreen's visual language (paper background, raised card) so the
 *  email-link destinations feel like the same product. RTL-safe via logical
 *  utilities. */
export function AuthFlowShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-10">
      <div className="pointer-events-none absolute -start-28 top-0 h-72 w-72 rounded-full bg-signal-100/70 blur-3xl" />
      <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-raised ring-1 ring-line animate-pop-in sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-signal-500 text-white">
            <Sparkle size={16} />
          </span>
          <span className="font-display font-bold text-ink">RIVA AI</span>
        </div>
        <h1 className="text-start font-display text-2xl font-bold text-ink">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
