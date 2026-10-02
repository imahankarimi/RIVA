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
          "flex h-10 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-ink",
          "transition-colors duration-150",
          "placeholder:text-ink-faint",
          "focus-visible:outline-none focus-visible:border-signal-400 focus-visible:ring-2 focus-visible:ring-signal-100",
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
