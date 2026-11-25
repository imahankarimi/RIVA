"use client";

import { useAuth } from "@/app/providers";

/**
 * Remounts the routed subtree whenever the account or active business changes.
 *
 * This is the client-side cache boundary: after logout, expiry, or a business
 * switch, every page-level hook starts from a clean slate, so data belonging to
 * the previous account cannot linger in memory or flash on screen.
 */
export function SessionKeyed({ children }: { children: React.ReactNode }) {
  const { status, user, business } = useAuth();
  const key =
    status === "authenticated"
      ? `${user?.id ?? "user"}:${business?.id ?? "business"}`
      : "guest";

  return (
    <div key={key} className="contents">
      {children}
    </div>
  );
}
