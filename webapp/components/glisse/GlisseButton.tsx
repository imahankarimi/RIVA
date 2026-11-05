"use client";

import { forwardRef } from "react";
import { Button as GlisseButton, type ButtonProps as GlisseButtonProps } from "glisse";
import { cn } from "@/lib/utils";

// Extended variant mapping for RIVA compatibility
type RivaVariant = "primary" | "secondary" | "ghost" | "danger" | "default" | "outline" | "destructive" | "link";
type GlisseVariant = "glass" | "filled";
type RivaSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends Omit<GlisseButtonProps, "variant"> {
  variant?: GlisseVariant | RivaVariant;
  size?: RivaSize; // Accept but ignore - Glisse handles sizing via CSS
}

/**
 * RIVA wrapper for Glisse Button
 * Maps RIVA variants to Glisse variants while preserving all original behavior
 * Note: Glisse doesn't use size props - sizing is handled via className
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "glass", size, ...props }, ref) => {
    // Map RIVA variants to Glisse variants
    const glisseVariant: GlisseVariant = (() => {
      switch (variant) {
        case "primary":
        case "default":
          return "filled";
        case "secondary":
        case "ghost":
        case "outline":
        case "link":
          return "glass";
        case "danger":
        case "destructive":
          return "glass"; // Will use destructive prop
        case "glass":
        case "filled":
          return variant;
        default:
          return "glass";
      }
    })();

    const isDestructive = variant === "danger" || variant === "destructive";

    return (
      <GlisseButton
        ref={ref}
        variant={glisseVariant}
        destructive={isDestructive}
        className={cn(
          // Ensure proper touch targets on mobile
          "min-h-[44px] sm:min-h-0",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "GlisseButton";
