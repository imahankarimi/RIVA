import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      dir="ltr"
      className={cn(
        "group relative inline-flex shrink-0 cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-full border bg-surface px-3.5 py-1.5 text-[13px] font-medium",
        className,
      )}
      {...props}
    >
      {/* Resting label — in flow, establishes the button's content width.
          The hidden spacer reserves room for the hover arrow so the overlay
          never clips against overflow-hidden. */}
      <span className="inline-block translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {text}
      </span>
      <span aria-hidden className="inline-block w-5" />
      {/* Hover overlay — the filled label + arrow that slides in over the fill */}
      <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-1.5 text-onSignal opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
        <span className="whitespace-nowrap">{text}</span>
        <ArrowRight className="size-3.5 flip-rtl" />
      </div>
      {/* Expanding primary fill that fills the pill on hover */}
      <div
        aria-hidden
        className="absolute left-[8px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-300 group-hover:left-0 group-hover:top-0 group-hover:h-full group-hover:w-full group-hover:translate-y-0 group-hover:rounded-none group-hover:bg-primary"
      />
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };