/* Sahakar Nyaya service worker — offline shell + smart runtime caching.
   Strategies:
   - install: precache everything in sw-manifest.json (shell + assets + small data)
   - index.html: network-first (redeploys appear immediately)
   - data/headnotes/*, data/search-index.json: stale-while-revalidate
   - pdfs/*, legal-docs/*: cache-first (immutable public records)
   - other data/*.json: stale-while-revalidate
*/
const VERSION = "v3";
const SHELL_CACHE = `sn-shell-${VERSION}`;
const DATA_CACHE = `sn-data-${VERSION}`;
const PDF_CACHE = `sn-pdf-${VERSION}`;

const BASE = new URL(self.registration.scope).pathname; // e.g. /sahakar-nyaya/

self.addEventListener("install", event => {
  event.waitUntil(
    fetch(`${BASE}sw-manifest.json`)
      .then(r => r.json())
      .then(manifest =>
        caches.open(SHELL_CACHE).then(cache =>
          cache.addAll(manifest.files.map(f => BASE + f)),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => ![SHELL_CACHE, DATA_CACHE, PDF_CACHE].includes(k)).map(k => caches.delete(k)),
      ).then(() => self.clients.claim()),
    ),
  );
});

function cacheNameFor(url) {
  if (url.includes("/pdfs/") || url.includes("/legal-docs/")) return PDF_CACHE;
  return DATA_CACHE;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(r => {
      if (r.ok) cache.put(request, r.clone());
      return r;
    })
    .catch(() => undefined);
  return cached || (await network) || new Response("Offline", { status: 503 });
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const r = await fetch(request);
  if (r.ok) cache.put(request, r.clone());
  return r;
}

async function networkFirstHTML(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const r = await fetch(request);
    if (r.ok) cache.put(request, r.clone());
    return r;
  } catch {
    return (await cache.match(request)) || new Response("Offline", { status: 503 });
  }
}

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  const path = url.pathname;

  if (path === BASE || path === `${BASE}index.html`) {
    event.respondWith(networkFirstHTML(event.request));
    return;
  }
  if (path.startsWith(`${BASE}data/headnotes/`) || path.startsWith(`${BASE}data/search-index.json`) ||
      path.startsWith(`${BASE}data/`)) {
    event.respondWith(staleWhileRevalidate(event.request, cacheNameFor(path)));
    return;
  }
  if (path.startsWith(`${BASE}pdfs/`) || path.startsWith(`${BASE}legal-docs/`)) {
    event.respondWith(cacheFirst(event.request, PDF_CACHE));
    return;
  }
  // hashed assets: cache-first with implicit SW precache
  if (path.startsWith(`${BASE}assets/`)) {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE));
  }
});
