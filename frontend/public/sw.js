const CACHE_NAME = "riva-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Intentionally do not intercept requests.
  // RIVA financial/API data must always use the network.
});
