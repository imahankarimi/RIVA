import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "success" | "warning" | "neutral";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground border border-line",
  destructive: "bg-destructive/10 text-destructive",
  outline: "border border-line text-foreground",
  ghost: "hover:bg-muted hover:text-foreground",
  success: "bg-moss-100 text-moss-700",
  warning: "bg-amber-100 text-amber-700",
  neutral: "bg-surfaceMuted text-ink-soft",
};

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all [&>svg]:size-3 [&>svg]:pointer-events-none",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };