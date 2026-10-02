import React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * SkeletonCard — the reference loading card shape: a header row with a
 * title bar plus an action dot, then content lines. Mirrors the compos
 * used in the reference's loading.tsx screens.
 */
function SkeletonCard({
  className,
  lines = 4,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn("rounded-xl bg-card p-4 ring-1 ring-line", className)}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="size-4 rounded-full" />
      </div>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard };