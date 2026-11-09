/* Offline support: precache the app shell, then cache-first for same-origin files and stale-while-revalidate for data. */
const V = "rf-2026-11-09-385-2366";
const PRE = ["./", "index.html", "style.css", "app.js", "times.js", "qr-lib.js", "data.json", "popular.json", "manifest.webmanifest", "img/logo.png", "img/logo-white.png", "img/sheikh-white.png", "img/icon-192.png", "fonts/expo-medium.ttf", "fonts/honorifics.ttf", "fonts/brackets.ttf", "fonts/readex.ttf", "fonts/hafs.ttf", "fonts/expo-semibold.ttf", "fonts/expo-book.ttf", "fonts/expo-bold.otf"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(PRE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("rf-") && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (/\/(data|popular)\.json$/.test(u.pathname) || u.pathname.endsWith("/") || u.pathname.endsWith(".html")) {
    e.respondWith(caches.open(V).then(async c => {
      const hit = await c.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok) { const cl = r.clone(); caches.open(V).then(c => c.put(e.request, cl)); } return r;
  })));
});
