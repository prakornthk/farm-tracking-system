/**
 * Service Worker — Farm Tracking LIFF App
 *
 * Caching strategy:
 *  - Precache: app shell (HTML, CSS, JS chunks)
 *  - Runtime cache: API responses (stale-while-revalidate)
 *  - Photos: cache-first with network fallback
 *
 * This enables the app to work partially offline — the shell loads
 * from cache, and queued actions sync when connectivity returns.
 */

const CACHE_VERSION = 'v1.0.0'
const SHELL_CACHE    = `farm-shell-${CACHE_VERSION}`
const RUNTIME_CACHE  = `farm-runtime-${CACHE_VERSION}`

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg'
]

// ── Install: precache shell ─────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// ── Activate: clean old caches ───────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [SHELL_CACHE, RUNTIME_CACHE]
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => !validCaches.includes(n)).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch: shell-first for navigation, network-only for API writes ──
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET
  if (request.method !== 'GET') return

  // API calls: network-only (always hit the server for fresh data)
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/activities')) {
    return
  }

  // For navigation requests: serve shell from cache, fall back to network
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetch(request).then(response => {
          // Cache the shell for future offline use
          if (response.ok) {
            const clone = response.clone()
            caches.open(SHELL_CACHE).then(cache => cache.put(request, clone))
          }
          return response
        }))
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Static assets: cache-first, stale-while-revalidate
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async cache => {
      const cached = await cache.match(request)
      const networkFetch = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone())
        return response
      }).catch(() => null)

      // Stale-while-revalidate: return cached immediately, update in background
      if (cached) {
        networkFetch // intentionally not awaited — background update
        return cached
      }

      // No cache — wait for network
      const response = await networkFetch
      return response || new Response('Offline', { status: 503 })
    })
  )
})
