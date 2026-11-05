"use client";

import { forwardRef } from "react";
import { SearchField as GlisseSearchField, type SearchFieldProps } from "glisse";
import { cn } from "@/lib/utils";

/**
 * RIVA wrapper for Glisse SearchField
 * Preserves magnifier icon, clear button, and all original behavior
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className, ...props }, ref) => {
    return (
      <GlisseSearchField
        ref={ref}
        className={cn(
          // Prevent iOS zoom on focus
          "text-base sm:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
SearchField.displayName = "GlisseSearchField";
