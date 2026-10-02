import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <textarea
        disabled={disabled}
        ref={ref}
        data-slot="textarea"
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-ink",
          "transition-colors duration-150 resize-none",
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
Textarea.displayName = "Textarea";

export { Textarea, type TextareaProps };
