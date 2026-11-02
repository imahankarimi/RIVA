"use client";

import { useEffect } from "react";

/**
 * Registers RIVA's service worker.
 *
 * The worker in `public/sw.js` deliberately does NOT cache anything — it only
 * makes RIVA installable as a standalone PWA. Financial data and API responses
 * must always come from the network; see the comment inside `sw.js` and the PWA
 * section of AGENT.md before changing this.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("RIVA service worker registration failed:", error);
    });
  }, []);

  return null;
}