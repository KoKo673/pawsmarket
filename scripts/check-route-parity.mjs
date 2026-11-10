#!/usr/bin/env node
// Every route in App.tsx must also be in nginx.conf's @spa allow-list.
//
// ── The failure this exists for ────────────────────────────────────
// Measured 2026-11-10: `/orders` and `/orders/:id` were added to App.tsx,
// linked from the order-result page, and returned a hard 404 on
// production for every customer who had just paid.
//
// nginx deliberately does not answer unknown paths with index.html — an
// earlier catch-all made every nonexistent URL return 200, which hid
// broken links and fed crawlers. The cost of that correctness is an
// explicit list of routes, and a list maintained by hand drifts.
//
// ── Why the dev server never catches this ──────────────────────────
// Vite answers every path with index.html. The route works locally, the
// build passes, the tests pass, and the 404 only appears in production.
// That asymmetry is the whole reason this check has to exist as a check
// rather than as a comment someone reads.
//
// Exit 1 on any route present in App.tsx and absent from nginx.conf.
// Also exit 1 on a route in nginx.conf that no longer exists in App.tsx —
// stale entries quietly widen the surface and are worth deleting.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const read = (p) => readFileSync(join(root, p), 'utf8')

// ── Routes the app declares ────────────────────────────────────────
const appSrc = read('src/App.tsx')

// The first path segment is what nginx matches. `/orders/:id` → `orders`,
// `/:secret/enter` is the backdoor and has its own rule, `*` is the
// not-found route and is not a path at all.
const declared = new Set()
for (const m of appSrc.matchAll(/path=["']([^"']+)["']/g)) {
  const p = m[1]
  if (p === '*' || p === '/') continue
  // `:secret` is dynamic; its shape is covered by the `/x/enter` rule.
  if (p.startsWith('/:')) continue
  const seg = p.split('/').filter(Boolean)[0]
  if (seg && !seg.startsWith(':')) declared.add(seg)
}

// ── Segments nginx actually lets through ───────────────────────────
const nginxConf = read('nginx.conf')

// The main alternation: ^/(a|b|c)(/|$)
const allowed = new Set()
const mainRe = /if \(\$uri ~ \^\/\(([^)]+)\)\(\/\|\$\)\)/
const mainMatch = nginxConf.match(mainRe)
if (!mainMatch) {
  console.error('check-route-parity: could not find the @spa route list in nginx.conf.')
  console.error('If the shape changed, update this checker — a check that silently')
  console.error('finds nothing is worse than no check at all.')
  process.exit(1)
}
for (const seg of mainMatch[1].split('|')) allowed.add(seg.trim())

// The opaque-secret rules match a path *prefix*, not a first segment:
//
//   if ($uri ~ ^/(s|store/dashboard|booking/manage|support/ticket)/)
//
// so `store/dashboard` is one alternation entry, not `store` and
// `dashboard`. Splitting on `|` alone is right, but each entry must be
// kept whole — and `booking` in the main list does NOT cover
// `booking/manage`, because the main list only matches a single segment.
const opaqueRe = /if \(\$uri ~ \^\/\(([^)]+)\)\//
const opaqueMatch = nginxConf.match(opaqueRe)
if (!opaqueMatch) {
  console.error('check-route-parity: could not find the opaque-secret rule in nginx.conf.')
  process.exit(1)
}
const opaquePrefixes = opaqueMatch[1].split('|').map((s) => s.trim())

// ── Compare ────────────────────────────────────────────────────────
// Reachability is decided on the FULL path, not the first segment,
// because nginx's opaque rules match multi-segment prefixes. `/booking`
// being allowed says nothing about `/booking/manage/<token>`.
function reachable(fullPath) {
  const segs = fullPath.split('/').filter(Boolean)
  const first = segs[0]
  if (allowed.has(first)) return true
  // A multi-segment opaque prefix: /store/dashboard/... matches `store/dashboard`
  for (const pre of opaquePrefixes) {
    const preSegs = pre.split('/')
    if (preSegs.every((s, i) => segs[i] === s)) return true
  }
  // `/<secret>/enter` — the admin backdoor. The first segment IS the
  // secret, so nginx matches it by shape (^/[^/]+/enter$) and it can
  // never be spelled out as a literal in either file.
  if (segs.length === 2 && segs[1] === 'enter') {
    return /if \(\$uri ~ \^\/\[\^\/\]\+\/enter\$\)/.test(nginxConf)
  }
  return false
}

// What the app declares as full paths, dynamic segments and all.
const declaredPaths = []
for (const m of appSrc.matchAll(/path=["']([^"']+)["']/g)) {
  const p = m[1]
  if (p === '*' || p === '/') continue
  declaredPaths.push(p)
}

const missing = declaredPaths.filter((p) => !reachable(p)).sort()

// Segments nginx allows that the app never declares anywhere. Computed
// on first segments for the plain list, on the full prefix for opaque.
const firstSegs = new Set(declaredPaths.map((p) => p.split('/').filter(Boolean)[0]))
const unused = [...allowed].filter((s) => !firstSegs.has(s)).sort()
const unusedPrefixes = opaquePrefixes.filter((pre) => {
  const preSegs = pre.split('/')
  return !declaredPaths.some((p) => {
    const s = p.split('/').filter(Boolean)
    return preSegs.every((x, i) => s[i] === x)
  })
})

if (missing.length) {
  console.error('\nROUTES IN App.tsx THAT nginx WILL 404:\n')
  for (const s of missing) console.error(`  ${s}`)
  const newSegs = [...new Set(missing.map((p) => p.split('/').filter(Boolean)[0]))]
  console.error('\nAdd the first segment to the @spa alternation in nginx.conf:')
  console.error(`  ^/(${mainMatch[1].split('|').join('|')}|${newSegs.join('|')})(/|$)\n`)
  console.error('This cannot be caught in the dev server — vite answers every')
  console.error('path with index.html, so the route works locally and 404s only')
  console.error('in production.\n')
}

const stale = [...unused, ...unusedPrefixes]
if (stale.length) {
  // Loud, not fatal: a stale entry is dead surface, not an outage.
  console.warn('\nnginx allows these but App.tsx no longer declares them:')
  for (const s of stale) console.warn(`  /${s}`)
  console.warn('Harmless, but worth deleting — a stale entry is surface nobody')
  console.warn('is watching.\n')
}

if (missing.length) process.exit(1)

console.log(`route parity OK — ${declared.size} app segments, all reachable through nginx`)