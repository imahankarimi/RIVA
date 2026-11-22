import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_RATIO = 594.74 / 155.12;

/**
 * RIVA wordmark.
 *
 * `tone="auto"` follows the page theme. `tone="light"` forces the white
 * wordmark for fixed Deep Navy device screens and panels.
 */
export function BrandMark({
  className,
  tone = "auto",
  width = 104,
  priority = false,
}: {
  className?: string;
  tone?: "auto" | "light" | "dark";
  width?: number;
  priority?: boolean;
}) {
  const height = Math.round(width / LOGO_RATIO);

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      {tone === "light" ? (
        <Image
          src="/brand/riva-logo-dark.svg"
          alt="RIVA"
          width={width}
          height={height}
          priority={priority}
        />
      ) : tone === "dark" ? (
        <Image
          src="/brand/riva-logo.svg"
          alt="RIVA"
          width={width}
          height={height}
          priority={priority}
        />
      ) : (
        <>
          <Image
            src="/brand/riva-logo.svg"
            alt="RIVA"
            width={width}
            height={height}
            priority={priority}
            className="dark:hidden"
          />
          <Image
            src="/brand/riva-logo-dark.svg"
            alt="RIVA"
            width={width}
            height={height}
            priority={priority}
            className="hidden dark:block"
          />
        </>
      )}
    </span>
  );
}
