/* JARVIS Service Worker — installierbar & offline-fähig.
   Bei Updates CACHE_NAME hochzählen. */

const CACHE_NAME = "jarvis-v2";
const ASSETS = [
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./js/main.js",
  "./js/config.js",
  "./js/db.js",
  "./js/ui.js",
  "./js/features.js",
  "./js/chat.js",
  "./js/voice.js",
  "./js/termux.js",
  "./js/settings.js",
  "./js/setup.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Nur eigene Origin behandeln; KI-API-Aufrufe immer ans Netz
  if (url.origin !== self.location.origin) return;

  // Navigationen: Network-First (immer aktuelle index.html), Fallback Cache
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Assets: Cache-First, dann Netz (und in Cache legen)
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return res;
        })
    )
  );
});
