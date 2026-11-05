"use client";

import { forwardRef } from "react";
import { Input as GlisseInput, type InputProps as GlisseInputProps } from "glisse";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<GlisseInputProps, "onValueChange"> {
  // Support both Glisse API (onValueChange) and React standard (onChange)
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
}

/**
 * RIVA wrapper for Glisse Input
 * Bridges Glisse's onValueChange API with React's standard onChange
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, onValueChange, ...props }, ref) => {
    const handleChange = (value: string) => {
      // Call Glisse's onValueChange if provided
      onValueChange?.(value);

      // Synthesize onChange event for React standard API compatibility
      if (onChange) {
        const syntheticEvent = {
          target: { value },
          currentTarget: { value },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <GlisseInput
        ref={ref}
        onValueChange={handleChange}
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
Input.displayName = "GlisseInput";
