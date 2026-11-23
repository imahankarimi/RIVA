"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Theme control for the public landing pages.
 *
 * Deliberately quieter than the application chrome: a single hairline ring,
 * no fill at rest, and a restrained cross-rotate between the two glyphs. The
 * visible glyph is driven by the `.dark` class set by the pre-paint bootstrap
 * script, so it is correct on the first frame; the accessible label follows
 * the provider's resolved theme.
 */
export function LandingThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "group relative inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line/80 text-ink-faint transition-colors duration-base ease-riva hover:border-signal-300 hover:bg-surfaceMuted/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-400/40",
        className
      )}
    >
      <span className="relative flex size-4 items-center justify-center" aria-hidden>
        <Sun
          size={16}
          strokeWidth={2}
          className="absolute rotate-90 scale-75 opacity-0 transition-[opacity,transform] duration-moderate ease-riva dark:rotate-0 dark:scale-100 dark:opacity-100"
        />
        <Moon
          size={16}
          strokeWidth={2}
          className="absolute rotate-0 scale-100 opacity-100 transition-[opacity,transform] duration-moderate ease-riva dark:-rotate-90 dark:scale-75 dark:opacity-0"
        />
      </span>
    </button>
  );
}
