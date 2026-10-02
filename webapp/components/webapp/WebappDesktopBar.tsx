"use client";

import { TopbarActions } from "@/components/webapp/TopbarActions";
import { cn } from "@/lib/utils";
import { GLASS } from "@/components/webapp/glass";

/** Desktop-only floating utility bar. Carries Business Switcher + Profile in a
 *  lightweight Liquid Glass container. The sidebar holds brand and navigation,
 *  so this stays minimal and unobtrusive. */
export function WebappDesktopBar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 hidden px-3 pt-3 md:flex lg:px-6">
      <div
        className={cn(
          "pointer-events-auto ms-auto flex items-center gap-2 rounded-xl px-3 py-2",
          GLASS.light.topbar,
          GLASS.light.glow,
          "relative transition-all duration-300 ease-out"
        )}
      >
        <TopbarActions />
      </div>
    </header>
  );
}