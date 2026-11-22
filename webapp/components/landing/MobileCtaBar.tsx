"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Mobile-only action bar.
 *
 * Appears once the hero CTAs have scrolled away so the primary action is
 * always one thumb away, then disappears on tablet and up where the fixed
 * navigation already carries it.
 */
export function MobileCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/[0.92] backdrop-blur-xl transition-[transform,opacity] duration-300 ease-riva md:hidden",
        visible
          ? "visible translate-y-0 opacity-100"
          : "invisible translate-y-full opacity-0"
      )}
    >
      <div className="flex items-center gap-2 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
        <Link
          href="/login"
          tabIndex={visible ? undefined : -1}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-line bg-surface text-[13px] font-semibold text-ink transition-colors hover:bg-surfaceMuted"
        >
          Sign in
        </Link>
        <Link
          href="/login"
          tabIndex={visible ? undefined : -1}
          className="group inline-flex h-11 flex-[1.35] items-center justify-center gap-1.5 rounded-lg bg-signal-500 text-[13px] font-semibold text-onSignal shadow-subtle transition-colors hover:bg-signal-600"
        >
          Get started
          <ArrowRight
            size={14}
            strokeWidth={2.2}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}
