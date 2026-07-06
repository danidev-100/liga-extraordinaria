// Service Worker — Liga Extraordinaria
// Only caches static assets, no navigation interception

const CACHE = "liga-extra-v1"

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener("fetch", (event) => {
  // Only cache same-origin static assets (images, fonts, etc.)
  const url = new URL(event.request.url)

  if (
    url.origin === self.location.origin &&
    /\.(png|svg|ico|webp|woff2?|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetched = fetch(event.request).then((response) => {
            cache.put(event.request, response.clone())
            return response
          })
          return cached ?? fetched
        }),
      ),
    )
  }
})
