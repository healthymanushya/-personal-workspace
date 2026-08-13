export function registerServiceWorker(): void {
  // Only in production: dev relies on Vite's own module server, and a
  // service worker there would fight HMR and serve stale modules.
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    // register() is idempotent for a given scope/script -- the browser
    // reuses the existing registration instead of creating a duplicate,
    // so this is safe to call on every load.
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("[pwa] service worker registration failed:", error);
    });
  });
}
