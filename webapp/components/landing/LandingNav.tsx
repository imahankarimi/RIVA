"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/landing/BrandMark";
import { LandingThemeToggle } from "@/components/landing/LandingThemeToggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Product", href: "#preview" },
  { label: "Ask RIVA", href: "#ask" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "How it works", href: "#how-it-works" },
] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-line bg-paper/[0.88] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-3 px-4 max-[359px]:gap-1 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" aria-label="RIVA — home" className="shrink-0 rounded-sm">
            <BrandMark priority width={92} />
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.12em] text-ink-faint sm:inline-flex">
            <span className="size-1 rounded-full bg-moss-500" />
            Web app
          </span>
        </div>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-md px-3 py-2 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-surfaceMuted hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 max-[359px]:gap-0.5 sm:gap-2">
          <LandingThemeToggle className="size-8 min-[360px]:size-9" />
          <Link
            href="/login"
            className="rounded-md px-2.5 py-2 text-[12.5px] font-medium text-ink-soft transition-colors hover:text-ink max-[359px]:px-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="group inline-flex h-9 items-center gap-1 rounded-lg bg-signal-500 px-3.5 text-[12.5px] font-semibold text-onSignal shadow-subtle transition-all duration-200 ease-riva hover:-translate-y-0.5 hover:bg-signal-600 max-[359px]:px-2.5 sm:px-4"
          >
            Get started
            <ArrowUpRight
              size={13}
              strokeWidth={2.2}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
