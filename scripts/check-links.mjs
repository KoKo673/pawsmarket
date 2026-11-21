#!/usr/bin/env node
/**
 * Find broken links in the site that actually shipped.
 *
 * ── What "broken" means here ──────────────────────────────────────────
 * Three different failures, and a checker that only does the first is a
 * checker that reports green on a site with no footer:
 *
 *   1. A link to a path the build does not serve (404).
 *   2. A link that is served, but a placeholder — `href="#"`, an empty
 *      `to=""`, a `javascript:void(0)`. These render as links and do
 *      nothing, which is worse than a 404: a 404 says "not here", a dead
 *      href says "here" and lies.
 *   3. A link to a route nginx will not rewrite to the SPA (a dynamic path
 *      added to App.tsx but not to the allow-list). That one *works* on the
 *      dev server, because Vite answers everything — so this check has to
 *      run against the built output + nginx rules, not just dist/.
 *
 * ── Why a crawl and not a list of routes from the source ──────────────
 * A hardcoded list checks the links someone remembered to add to it. The
 * interesting links — a store whose page prerendered wrong, a product id
 * that no longer exists — only exist in real data. This walks the built
 * HTML plus the sitemap, and follows every distinct same-origin target.
 *
 * ── What it deliberately does not do ──────────────────────────────────
 * It does not fetch external URLs. A checker that fails because a
 * third-party site is slow teaches people to ignore it, and this project's
 * audience is behind a network where foreign hosts time out regularly.
 * External links are reported as "not checked" by count, so nobody assumes
 * they were.
 *
 * Usage:
 *   node scripts/check-links.mjs                  # against https://pawsmarket.ir
 *   node scripts/check-links.mjs --base http://localhost:9010
 *   node scripts/check-links.mjs --dist           # static analysis of dist/
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const DIST_ONLY = args.includes('--dist')
const baseArg = args.indexOf('--base')
const BASE = (baseArg !== -1 ? args[baseArg + 1] : 'https://pawsmarket.ir').replace(/\/$/, '')
const TIMEOUT = 20000
const CONCURRENCY = 6

// ── Dead-link shapes that a 200 cannot catch ─────────────────────────
// An `href="#"` is served fine and does nothing. These are the ones seen
// in real code; the list is short on purpose, because a pattern that is
// too clever starts flagging legitimate in-page anchors.
const PLACEHOLDER = [
  { re: /^#$/, why: 'href="#" — does nothing' },
  { re: /^javascript:/i, why: 'javascript: URL' },
  { re: /^\/?#?$/, why: 'empty target' },
]

/** Every href/to in a piece of HTML, deduplicated. */
function linksIn(html) {
  const out = new Set()
  for (const m of html.matchAll(/\shref="([^"]*)"/g)) out.add(m[1])
  for (const m of html.matchAll(/\sto="([^"]*)"/g)) out.add(m[1])
  return [...out]
}

/** Resolve a discovered href against the page it was found on. */
function resolve(href, fromPath) {
  if (!href) return null
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return { external: true }
  if (/^https?:\/\//i.test(href)) {
    try {
      const u = new URL(href)
      const base = new URL(BASE)
      if (u.origin !== base.origin) return { external: true }
      return { path: u.pathname + u.search }
    } catch { return { invalid: href } }
  }
  if (!href.startsWith('/')) {
    // Relative to the page's directory. `/store/x/` + `y` → `/store/x/y`.
    try {
      const u = new URL(href, `${BASE}${fromPath}`)
      return { path: u.pathname + u.search }
    } catch { return { invalid: href } }
  }
  return { path: href }
}

// ── Collect the starting set ─────────────────────────────────────────
function fromDist() {
  const pages = new Set(['/'])
  const storeDir = join('dist', 'store')
  if (existsSync(storeDir)) {
    for (const slug of readdirSync(storeDir)) {
      if (statSync(join(storeDir, slug)).isDirectory()) pages.add(`/store/${slug}`)
    }
  }
  const sitemap = join('dist', 'sitemap.xml')
  if (existsSync(sitemap)) {
    for (const m of readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
      try { pages.add(new URL(m[1]).pathname) } catch { /* skip a bad loc */ }
    }
  }
  return [...pages]
}

async function fetchStatus(path) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { 'user-agent': 'pawsmarket-link-check/1.0' },
    })
    // Only HTML carries links to follow. Without this check the crawler
    // also scanned sitemap.xml, and its `<loc>` template fragments showed
    // up as '/assets/${n}' — a broken link that was really a checker bug,
    // which is the worst kind of finding: it wastes a person's morning.
    const type = res.headers.get('content-type') || ''
    const isHtml = type.includes('text/html')
    return {
      status: res.status,
      html: res.status === 200 && isHtml ? await res.text() : '',
      type,
    }
  } catch (err) {
    return { status: 0, error: err.name === 'TimeoutError' ? 'timeout' : err.message }
  }
}

async function main() {
  const seeds = fromDist()
  console.log(`[links] base=${BASE}  seeds=${seeds.length}`)

  const seen = new Set()
  const queue = [...seeds]
  // Which page each target was first found on. Without this, a dead
  // `href="#"` injected once is reported against every page crawled, and
  // the person reading the output has no idea where to look.
  const discoveredFrom = new Map()
  const broken = []
  const external = new Set()
  let checked = 0

  async function worker() {
    while (queue.length) {
      const path = queue.shift()
      if (seen.has(path)) continue
      seen.add(path)

      const page = await fetchStatus(path)
      checked += 1
      if (page.status !== 200) {
        broken.push({
          path,
          status: page.status,
          error: page.error,
          foundOn: discoveredFrom.get(path),
        })
        continue
      }
      if (DIST_ONLY) continue

      for (const href of linksIn(page.html)) {
        const placeholder = PLACEHOLDER.find((p) => p.re.test(href))
        if (placeholder) { broken.push({ foundOn: path, href, why: placeholder.why }); continue }

        const target = resolve(href, path)
        if (!target) continue
        if (target.external) { external.add(href); continue }
        if (target.invalid) { broken.push({ foundOn: path, href, why: 'unparseable href' }); continue }
        if (!seen.has(target.path)) {
          discoveredFrom.set(target.path, path)
          queue.push(target.path)
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  // ── Report ────────────────────────────────────────────────────────
  console.log(`[links] checked ${checked} internal target(s), ` +
              `${seen.size} distinct, ${external.size} external (not checked)`)

  if (broken.length === 0) {
    console.log('[links] no broken internal links')
    return 0
  }

  console.error(`\n[links] ${broken.length} broken link(s):`)
  for (const b of broken) {
    const where = b.foundOn ? `  (linked from ${b.foundOn})` : '  (seed page)'
    if (b.href) console.error(`  "${b.href}"   — ${b.why}${where}`)
    else console.error(`  ${b.path}  →  ${b.status || b.error}${where}`)
  }
  return 1
}

process.exit(await main())