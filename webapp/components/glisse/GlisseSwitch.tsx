"use client";

import { forwardRef } from "react";
import { Switch as GlisseSwitch, type SwitchProps as GlisseSwitchProps } from "glisse";

export interface SwitchProps extends Omit<GlisseSwitchProps, "onCheckedChange"> {
  // Support both Glisse API (onCheckedChange) and RIVA API (onChange)
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

/**
 * RIVA wrapper for Glisse Switch
 * Bridges Glisse's onCheckedChange API with RIVA's onChange API
 * RTL is automatically handled by Glisse's internal implementation
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ onChange, onCheckedChange, label, ...props }, ref) => {
    const handleChange = (checked: boolean) => {
      onChange?.(checked);
      onCheckedChange?.(checked);
    };

    return (
      <GlisseSwitch
        ref={ref}
        onCheckedChange={handleChange}
        aria-label={label}
        {...props}
      />
    );
  }
);
Switch.displayName = "GlisseSwitch";
