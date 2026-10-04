import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        disabled={disabled}
        ref={ref}
        data-slot="input"
        className={cn(
          "flex h-9 w-full rounded-lg border border-input bg-surface px-3 py-1.5 text-base text-ink",
          "transition-colors duration-150",
          "placeholder:text-ink-faint",
          "focus-visible:outline-none focus-visible:border-signal-400 focus-visible:ring-2 focus-visible:ring-signal-100/60",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surfaceMuted",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, type InputProps };
