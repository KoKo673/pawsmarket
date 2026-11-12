/* PawsMarket service worker.
 *
 * ── Why this exists ────────────────────────────────────────────────
 * NFR-4.6 in the SRS said "PWA / آفلاین ✅". There was no manifest and no
 * service worker — not in the source, not in the build, and
 * /manifest.webmanifest answered 404 on the live site. The claim was
 * false, which is worse than the feature being absent, because a plan
 * written against it assumes something exists.
 *
 * ── What it does, and deliberately does not ────────────────────────
 * It caches the app SHELL — the HTML, the assets it names, the icons —
 * so a repeat visit opens instantly and a dead network shows the cached
 * shell instead of the browser's error page.
 *
 * It does NOT cache API responses. Prices, stock and the cart must never
 * be served from a cache: a customer looking at a stale price and then
 * being charged the real one is the worst bug this site could ship.
 * Everything under /api/ goes straight to the network.
 *
 * ── Versioning ─────────────────────────────────────────────────────
 * The cache name carries a version. Bumping it is what retires the old
 * cache: a `cache-first` worker with a static name serves the previous
 * deploy forever, which is the classic way a PWA "breaks" a site that
 * deployed fine.
 */

const VERSION = 'v1'
const SHELL = `pawsmarket-shell-${VERSION}`

/* Assets that make the shell usable offline. Kept short: every entry is
 * something that must be fetched successfully during install, and one
 * 404 here fails the whole install. Hashed bundles are NOT listed —
 * their names change every build, so they are cached on first use in the
 * fetch handler instead. */
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) =>
      // `addAll` rejects the whole install if one entry 404s, which is
      // the behaviour wanted: a half-populated shell is worse than none.
      cache.addAll(PRECACHE).then(() => self.skipWaiting()),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('pawsmarket-shell-') && k !== SHELL)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only GET is cacheable. A POST is a mutation and must always reach the
  // server, even offline (where it should fail loudly, not replay later).
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Same origin only. A cross-origin request — map tiles, an image from
  // another host — is not ours to cache and would blow the quota.
  if (url.origin !== self.location.origin) return

  // NEVER cache the API. A stale price or stock count is a wrong charge.
  if (url.pathname.startsWith('/api/')) return

  // Health endpoints must reflect reality, never a cache.
  if (url.pathname.startsWith('/health')) return

  // ── Hashed build assets: cache-first ────────────────────────────
  // `/assets/*` filenames carry a content hash, so a cached copy is by
  // definition the right content for that URL.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(SHELL).then((c) => c.put(request, copy))
            }
            return res
          }),
      ),
    )
    return
  }

  // ── Documents: network-first, cache as the fallback ─────────────
  // Network-first because a deploy must be visible immediately; the
  // cache exists for when the network is gone, not to make the site
  // look fast while serving week-old HTML.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // The prerendered page, stored per URL so an offline visit to
          // /store/<slug> returns that page and not the homepage.
          if (res.ok) {
            const copy = res.clone()
            caches.open(SHELL).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match('/')),
        ),
    )
    return
  }

  // Everything else: let the browser handle it.
})

/* A push notification is not implemented — the backend sends SMS via
 * Kavenegar, and a second channel would need a subscription table and a
 * privacy decision. Left out rather than stubbed. */