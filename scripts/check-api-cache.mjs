#!/usr/bin/env node
/**
 * Prove the API cache caches exactly what it should — and nothing else.
 *
 * ── Why a check that talks to the live origin ──────────────────────
 * `nginx -t` says the config parses. It cannot say that `/api/shop/cart`
 * is not cached, that two query strings do not share an entry, or that a
 * 304 is not stored for 60 seconds. Those are the faults that would show
 * one visitor another's data, and each one is a request away.
 *
 * It runs against the ORIGIN (127.0.0.1 inside the frontend container's
 * network), not the public hostname, because ArvanCloud answers BYPASS on
 * /api/ and would hide the origin's behaviour entirely — measured
 * 2026-11-22.
 *
 *   node scripts/check-api-cache.mjs [http://127.0.0.1]
 *
 * Exits non-zero on the first fault, printing which one.
 */

const BASE = process.argv[2] || 'http://127.0.0.1'
let failures = 0
const pass = (m) => console.log(`  ok    ${m}`)
const fail = (m) => { console.error(`  FAIL  ${m}`); failures += 1 }

async function get(path, headers = {}) {
  const r = await fetch(BASE + path, { headers })
  return {
    status: r.status,
    cache: r.headers.get('x-cache-origin'),
    nosniff: r.headers.get('x-content-type-options'),
    body: await r.text(),
  }
}

// ── 1. The two public reads are cached ──────────────────────────────
for (const p of ['/api/shop/products?limit=5', '/api/shop/categories']) {
  await get(p)                        // first: MISS (cold)
  const second = await get(p)         // second: HIT
  if (second.cache === 'HIT') pass(`${p} → HIT on the second request`)
  else fail(`${p} → ${second.cache}, expected HIT after two requests`)
}

// ── 2. The query string is part of the key ──────────────────────────
{
  const a = await get('/api/shop/products?limit=5')
  const b = await get('/api/shop/products?limit=6')
  // Different bodies, different keys. If the key ignored the query, `b`
  // would HIT on `a`'s entry and return 5 items.
  const n5 = JSON.parse(a.body).items.length
  const n6 = JSON.parse(b.body).items.length
  if (n5 === 5 && n6 === 6) pass('?limit=5 and ?limit=6 return different bodies')
  else fail(`?limit=5 returned ${n5} items and ?limit=6 returned ${n6}`)
}

// ── 3. Nothing identity-bearing is cached ───────────────────────────
// These are the paths where a shared cache would be a data leak, not a
// performance question. Each is checked with a logged-out GET; the point is
// that nginx must never store the response.
const MUST_NOT_CACHE = [
  '/api/shop/cart',
  '/api/shop/orders',
  '/api/pets',
  '/api/auth/me',
]
for (const p of MUST_NOT_CACHE) {
  await get(p)
  const second = await get(p)
  if (second.cache === 'HIT') fail(`${p} → HIT — an identity route is cached`)
  else pass(`${p} → ${second.cache || 'MISS'} (not cached)`)
}

// ── 4. A request carrying a token is never served from cache ────────
{
  await get('/api/shop/products?limit=5')          // warm it
  const withToken = await get('/api/shop/products?limit=5', {
    Authorization: 'Bearer this-is-not-a-real-token',
  })
  // A 401 is the correct answer; a HIT would mean the cached public body
  // was handed to a caller who identified themselves.
  if (withToken.cache === 'HIT') {
    fail('/api/shop/products with an Authorization header → HIT')
  } else {
    pass(`/api/shop/products with a token → ${withToken.cache || 'MISS'} (bypasses cache)`)
  }
}

// ── 5. The security headers survive the add_header in that block ────
{
  const r = await get('/api/shop/products?limit=1')
  if (r.nosniff === 'nosniff') pass('nosniff still present on a cached API response')
  else fail('nosniff MISSING — the add_header in location /api/ dropped it')
}

console.log(failures === 0 ? '\napi-cache: OK' : `\napi-cache: ${failures} fault(s)`)
process.exit(failures === 0 ? 0 : 1)