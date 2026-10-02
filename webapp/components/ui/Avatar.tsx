"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const Avatar = React.forwardRef<HTMLDivElement, {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}>(({ name, size = "md", className, ...props }, ref) => {
  const sizes = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" };
  return (
    <div
      ref={ref}
      data-slot="avatar"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-signal-100 font-semibold text-signal-700",
        sizes[size],
        className
      )}
      {...props}
    >
      {getInitials(name)}
    </div>
  );
});
Avatar.displayName = "Avatar";

export { Avatar };
