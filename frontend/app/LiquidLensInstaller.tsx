"use client";

import { useEffect } from "react";
import { installLiquidLens } from "@/lib/motion/liquidLens";

/**
 * Installs the Liquid Lens pointer tracker on mount.
 *
 * This component calls `installLiquidLens()` once when the app loads, enabling
 * pointer-tracked highlights on all `.glass-lens` navigation elements. The
 * cleanup function is called on unmount.
 */
export function LiquidLensInstaller() {
  useEffect(() => {
    const cleanup = installLiquidLens();
    return cleanup;
  }, []);

  return null;
}
