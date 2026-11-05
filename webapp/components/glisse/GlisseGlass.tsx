"use client";

import { forwardRef } from "react";
import { Glass as GlisseGlass, type GlassProps } from "glisse";

/**
 * RIVA wrapper for Glisse Glass
 * Preserves refraction, bend, dispersion, frost, rim shine, and all optical effects
 */
export const Glass = forwardRef<HTMLDivElement, GlassProps>(
  (props, ref) => {
    return <GlisseGlass ref={ref} {...props} />;
  }
);
Glass.displayName = "GlisseGlass";
