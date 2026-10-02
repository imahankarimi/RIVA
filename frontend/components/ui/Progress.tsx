"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  max = 100,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number; max?: number }) {
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(Math.min(value ?? 0, max))}
      data-valuenow={value}
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{
          width: `${max > 0 ? Math.max(0, Math.min(100, ((value ?? 0) / max) * 100)) : 0}%`,
        }}
      />
    </div>
  )
}

export { Progress }