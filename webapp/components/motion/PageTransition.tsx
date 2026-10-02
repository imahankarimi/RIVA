"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

/**
 * Wraps the app shell's routed content. Keys on pathname so each route
 * gets a small, consistent fade+rise on entry — not a full slide/route
 * transition, which would feel heavy for a data-dense accounting app.
 * Self-contained: reads the pathname itself, so callers just render
 * <PageTransition>{children}</PageTransition> once in the shell layout.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: DURATION.moderate, ease: EASE_OUT }}
        className="flex min-h-screen flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
