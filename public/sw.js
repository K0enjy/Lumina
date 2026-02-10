/// <reference lib="webworker" />

// Bump this version to invalidate all caches on deploy
const CACHE_VERSION = 1
const CACHE_NAME = `lumina-cache-v${CACHE_VERSION}`
const OFFLINE_URL = '/offline'

// App shell assets to precache on install
const PRECACHE_ASSETS = [
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/apple-touch-icon.svg',
  '/icons/icon-maskable.svg',
]

// Install: precache offline page HTML and app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Precache static assets
      await cache.addAll(PRECACHE_ASSETS)

      // Fetch and cache the offline page HTML response explicitly
      // This ensures we have the rendered HTML, not just the route
      const offlineResponse = await fetch(OFFLINE_URL)
      if (offlineResponse.ok) {
        await cache.put(OFFLINE_URL, offlineResponse)
      }
    })
  )
  self.skipWaiting()
})

// Activate: delete caches that don't match the current version
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: route requests through appropriate caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip non-HTTP URLs (chrome-extension://, etc.)
  if (!request.url.startsWith('http')) return

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    )
    return
  }

  // Static assets (/_next/static/, /icons/, /audio/): cache-first
  if (
    request.url.includes('/_next/static/') ||
    request.url.includes('/icons/') ||
    request.url.includes('/audio/')
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
            return response
          })
      )
    )
    return
  }

  // All other requests (data/API): network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone)
        })
        return response
      })
      .catch(() => caches.match(request))
  )
})
