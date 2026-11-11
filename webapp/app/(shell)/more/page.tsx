"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The More interface has been consolidated to the MobileTabBar sheet (bottom tab bar).
 * This page redirects to home to avoid duplicate interfaces.
 * The MobileTabBar component (in components/webapp/MobileTabBar.tsx) provides
 * the single, authoritative More sheet with the X button for closing.
 */
export default function MorePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home; the More sheet is accessible via the bottom tab bar
    router.replace("/home");
  }, [router]);

  return null;
}