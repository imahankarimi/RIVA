"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "destructive" | "success" | "warning";

const variantStyles: Record<Variant, string> = {
  default: "border-signal-100 bg-signal-50 text-signal-700",
  destructive: "border-rose-100 bg-rose-100/40 text-rose-700",
  success: "border-moss-100 bg-moss-100/40 text-moss-700",
  warning: "border-amber-100 bg-amber-100/40 text-amber-700",
};

function Alert({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & { variant?: Variant }) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-[13.5px] leading-relaxed",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Alert };
