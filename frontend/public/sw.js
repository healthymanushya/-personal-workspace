// Production-only service worker for Personal Workspace.
//
// Scope is deliberately narrow: it only ever touches same-origin GET
// requests for static build assets and the HTML app shell. It never
// intercepts the backend API (a different origin entirely), any request
// under /api/, or any non-GET request -- so it can never cache a login
// response, a JWT, or per-user task/dashboard data, and can never serve
// stale data for those.

const CACHE_VERSION = "pw-shell-v1";
const SHELL_URL = "/";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.add(new Request(SHELL_URL, { cache: "reload" })))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.svg"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever handle same-origin GET requests. Everything else (the
  // cross-origin API, any POST/PATCH/DELETE, auth calls) passes straight
  // through to the network untouched -- no caching, no interception.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // App shell: network-first so a new deploy is picked up immediately;
  // fall back to the cached shell only when there is no network at all.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(SHELL_URL, copy));
          return response;
        })
        .catch(() => caches.match(SHELL_URL))
    );
    return;
  }

  // Content-hashed static assets: cache-first is safe since a new deploy
  // always produces new filenames, so a cached entry can never go stale.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});
