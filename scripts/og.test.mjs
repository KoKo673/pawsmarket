/**
 * Guards the social-preview tags in the built output.
 *
 * ── Why this is a test and not a build check ──────────────────────────
 * The tags are injected by a regex against the built shell. If index.html
 * changes shape — a reformatted tag, a rename, someone moving the marker
 * — `apply()` records a miss and the page is written without that tag,
 * or the marker is not found at all. Both are silent: the build still
 * says "all checks passed", the site still works, and the only symptom
 * is a link that shows a bare URL when someone pastes it into Telegram.
 * That is unfalsifiable by looking at the site, which is exactly the kind
 * of failure this file exists to catch.
 *
 * Measured 2026-11-21, before this file: zero og: tags anywhere, in
 * index.html or the 343 prerendered store pages.
 *
 * Runs against dist/, so it needs a build first. Skips (rather than
 * fails) when dist/ is not there, so `npm test` stays useful on a clean
 * checkout.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'

/** Every og:/twitter: meta tag in a document, as (key → content). */
function metas(html) {
  const out = {}
  for (const m of html.matchAll(/<meta\s+(?:property|name)="((?:og|twitter):[^"]+)"\s+content="([^"]*)"/g)) {
    out[m[1]] = m[2]
  }
  return out
}

const REQUIRED = {
  // ogp.me lists these four as required; a scraper missing any of them
  // will not build a card at all.
  'og:title': null,
  'og:type': null,
  'og:image': null,
  'og:url': null,
  // Not required by ogp.me, but X only renders the large card with it, and
  // without the per-network title X falls back to the page title.
  'twitter:card': null,
  'twitter:title': null,
  'twitter:image': null,
  'og:image:alt': null,
}

test('the built shell carries a complete preview card', (t) => {
  const file = join(DIST, 'index.html')
  if (!existsSync(file)) return t.skip('no dist/ — run a build first')
  const m = metas(readFileSync(file, 'utf8'))
  for (const key of Object.keys(REQUIRED)) {
    assert.ok(m[key], `missing ${key}`)
  }
  assert.equal(m['twitter:card'], 'summary_large_image')
})

test('og:image is absolute, because every scraper resolves it against nothing', (t) => {
  const file = join(DIST, 'index.html')
  if (!existsSync(file)) return t.skip('no dist/')
  const { 'og:image': img } = metas(readFileSync(file, 'utf8'))
  assert.match(img, /^https?:\/\//, `og:image is not absolute: ${img}`)
})

test('the declared og:image size matches the file that is actually served', (t) => {
  const file = join(DIST, 'index.html')
  if (!existsSync(file)) return t.skip('no dist/')
  const m = metas(readFileSync(file, 'utf8'))
  const img = join(DIST, new URL(m['og:image']).pathname.replace(/^\//, ''))
  assert.ok(existsSync(img), `og:image is declared but ${img} does not exist`)

  // JPEG SOF marker: the dims the vendor will crop from, not what we meant.
  const buf = readFileSync(img)
  let w = 0, h = 0
  for (let i = 0; i < buf.length - 9; i++) {
    if (buf[i] === 0xFF && (buf[i + 1] === 0xC0 || buf[i + 1] === 0xC2)) {
      h = buf.readUInt16BE(i + 5)
      w = buf.readUInt16BE(i + 7)
      break
    }
  }
  assert.equal(String(w), m['og:image:width'], 'og:image:width disagrees with the file')
  assert.equal(String(h), m['og:image:height'], 'og:image:height disagrees with the file')
  // Meta: "at least 1200 x 630", minimum 600x315.
  assert.ok(w >= 1200 && h >= 630, `og:image is ${w}x${h}, below 1200x630`)
})

test('the placeholder comment never survives into a shipped page', (t) => {
  if (!existsSync(DIST)) return t.skip('no dist/')
  for (const f of ['index.html', '404.html']) {
    const p = join(DIST, f)
    if (!existsSync(p)) continue
    assert.ok(
      !readFileSync(p, 'utf8').includes('open-graph-placeholder'),
      `${f} still ships the raw placeholder — prerender did not fill it`,
    )
  }
})

test('every store page names its own store, not the site', (t) => {
  const dir = join(DIST, 'store')
  if (!existsSync(dir)) return t.skip('no prerendered store pages')
  const slugs = readdirSync(dir)
  assert.ok(slugs.length > 0)

  const titles = new Set()
  for (const slug of slugs) {
    const p = join(dir, slug, 'index.html')
    if (!existsSync(p)) continue
    const m = metas(readFileSync(p, 'utf8'))
    assert.ok(m['og:title'], `${slug}: no og:title`)
    assert.ok(m['og:url'], `${slug}: no og:url`)
    assert.ok(m['og:url'].endsWith(`/store/${slug}`), `${slug}: og:url points elsewhere`)
    assert.ok(m['og:title'] !== 'پازمارکت — حیوانات و لوازم نزدیک شما',
      `${slug}: still carries the site title instead of the store's`)
    titles.add(m['og:title'])
  }
  // If the per-store swap silently stopped working every page would share
  // one title; a handful of collisions between real store names is fine.
  assert.ok(titles.size > slugs.length * 0.9,
    `only ${titles.size} distinct titles across ${slugs.length} pages`)
})
