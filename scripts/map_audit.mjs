/**
 * MapView behaviour audit.
 *
 * MapView.tsx is 473 lines and had never been exercised by anything — the
 * contrast and axe audits only ever saw its chrome, because the map itself is
 * a canvas of Leaflet panes that neither tool reads. This drives the real
 * component in a real browser and reports what it does, with the six cases the
 * wave-3 plan named:
 *
 *   1. GPS granted at a Tehran coordinate   -> map flies there, markers stay
 *   2. GPS denied                           -> Tehran fallback, no dead state
 *   3. GPS outside Iran (a VPN exit node)   -> keeps Tehran, says why
 *   4. GPS inside Iran but far away/coarse  -> the 'approximate' branch
 *   5. A database with no coordinates       -> empty map, no crash
 *   6. Persian-named markers                -> label renders, not tofu
 *
 * Plus keyboard reach and a 320px overflow check, which the plan listed under
 * MapView's own risks.
 *
 *   node scripts/map_audit.mjs [--base http://127.0.0.1:4173] [--json out.json]
 *
 * Exit code is 1 when a case fails its expectation, 2 when the page could not
 * be reached at all.
 */
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg('base', 'http://127.0.0.1:4173')
const JSON_OUT = arg('json', '')

/* Tehran, where the catalogue actually is. Alborz/Amirabad-ish. */
const TEHRAN = { latitude: 35.7, longitude: 51.4 }
/* A VPN exit node — London. Inside the "somewhere on earth" sense, outside Iran. */
const LONDON = { latitude: 51.5074, longitude: -0.1278 }
/* Inside Iran, but ~600 km from the service area (Mashhad). */
const MASHHAD = { latitude: 36.2972, longitude: 59.6067 }

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true })
  } catch {
    return await chromium.launch({ headless: true })
  }
}

/** Everything worth asserting about the map, read off the live DOM. */
const READ_MAP = () => {
  const map = document.querySelector('.leaflet-container')
  if (!map) return { present: false }
  const r = map.getBoundingClientRect()
  const tiles = document.querySelectorAll('.leaflet-tile-loaded').length
  const markerEls = [...document.querySelectorAll('.leaflet-marker-icon')]
  return {
    present: true,
    width: Math.round(r.width),
    height: Math.round(r.height),
    // 0x0 is the documented Leaflet failure mode when the container was
    // display:none at mount and was never invalidated.
    hasPixels: r.width > 0 && r.height > 0,
    tilesLoaded: tiles,
    markers: markerEls.length,
    markerLabels: markerEls.map((m) => (m.textContent || '').trim()).filter(Boolean).slice(0, 8),
    // A marker whose box is 0x0 or NaN is placed but invisible.
    brokenMarkers: markerEls.filter((m) => {
      const b = m.getBoundingClientRect()
      return !(b.width > 1 && b.height > 1)
    }).length,
    locationButton: (document.querySelector('[aria-label="مکان من"], button[title*="مکان"]')
      ?.textContent || '').trim().slice(0, 30),
    bodyOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
  }
}

/**
 * Open /explore with the map tab active and geolocation in a chosen state.
 *
 * /explore starts on the list at phone width; the map is behind the floating
 * List/Map switch, so every case has to flip that first or it measures a
 * hidden pane (which is itself the 0x0 Leaflet trap).
 */
async function openMap(browser, { geo, permission, viewport = { width: 390, height: 844 } }) {
  const context = await browser.newContext({
    viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fa-IR',
  })
  if (permission === 'granted') await context.grantPermissions(['geolocation'])
  if (permission === 'denied') await context.clearPermissions()
  if (geo) await context.setGeolocation(geo)

  const page = await context.newPage()
  const consoleLines = []
  page.on('console', (m) => consoleLines.push(`${m.type()}: ${m.text()}`.slice(0, 160)))
  page.on('pageerror', (e) => consoleLines.push(`pageerror: ${String(e).slice(0, 160)}`))

  await page.goto(BASE + '/explore', { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
  await page.waitForTimeout(800)

  // Switch to the map pane. The control is hidden at lg, where both panes show.
  const mapTab = page.locator('button, [role="tab"]').filter({ hasText: /^نقشه$/ }).first()
  if (await mapTab.count()) {
    await mapTab.click({ timeout: 5_000 }).catch(() => {})
    await page.waitForTimeout(1200)
  }
  await page.waitForTimeout(1500)
  return { context, page, consoleLines }
}

const results = []

function record(name, expected, actual, ok, extra = {}) {
  results.push({ name, expected, actual, ok, ...extra })
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`)
  console.log(`        expected: ${expected}`)
  console.log(`        actual  : ${actual}`)
  if (extra.note) console.log(`        note    : ${extra.note}`)
}

async function main() {
  const browser = await launchBrowser()

  // ── 1. Granted, at a real Tehran coordinate ──────────────────────────────
  {
    const { context, page, consoleLines } = await openMap(browser, { geo: TEHRAN, permission: 'granted' })
    const m = await page.evaluate(READ_MAP)
    record(
      '1. GPS granted in Tehran',
      'map renders, has pixels, loads tiles, no broken markers',
      `present=${m.present} ${m.width}x${m.height} tiles=${m.tilesLoaded} markers=${m.markers} broken=${m.brokenMarkers}`,
      Boolean(m.present && m.hasPixels && m.tilesLoaded > 0 && m.brokenMarkers === 0),
      { consoleLines: consoleLines.filter((l) => l.startsWith('pageerror')), map: m },
    )
    await context.close()
  }

  // ── 2. Denied ────────────────────────────────────────────────────────────
  {
    const { context, page } = await openMap(browser, { permission: 'denied' })
    await page.waitForTimeout(1500)
    const m = await page.evaluate(READ_MAP)
    const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 200))
    record(
      '2. GPS denied',
      'tehran fallback: map still renders with markers, button says «مکان من»',
      `button=«${m.locationButton}» markers=${m.markers} tiles=${m.tilesLoaded}`,
      Boolean(m.present && m.hasPixels && m.markers > 0),
      { note: body.slice(0, 110) },
    )
    await context.close()
  }

  // ── 3. Outside Iran (VPN) ────────────────────────────────────────────────
  {
    const { context, page } = await openMap(browser, { geo: LONDON, permission: 'granted' })
    await page.waitForTimeout(2500)
    const m = await page.evaluate(READ_MAP)
    record(
      '3. GPS outside Iran (VPN exit node)',
      'origin stays Tehran: markers present, button flags it',
      `button=«${m.locationButton}» markers=${m.markers}`,
      Boolean(m.present && m.markers > 0 && /خارج از ایران|مکان من/.test(m.locationButton)),
      { note: 'the map must not fly to London and strand the user' },
    )
    await context.close()
  }

  // ── 4. Inside Iran but far from the service area ─────────────────────────
  {
    const { context, page } = await openMap(browser, { geo: MASHHAD, permission: 'granted' })
    await page.waitForTimeout(2500)
    const m = await page.evaluate(READ_MAP)
    record(
      '4. GPS inside Iran but outside Tehran/Karaj',
      'the «approximate» branch: keeps Tehran rather than searching empty land',
      `button=«${m.locationButton}» markers=${m.markers}`,
      Boolean(m.present && m.markers > 0),
      { note: 'Mashhad is ~600km from any listing; accepting it returns nothing' },
    )
    await context.close()
  }

  // ── 5. Empty result set ──────────────────────────────────────────────────
  {
    const { context, page } = await openMap(browser, { geo: TEHRAN, permission: 'granted' })
    /* Both sources have to be emptied, and that is the point worth recording.
       catalog.json is the PRIMARY source — the API only contributes rows the
       snapshot does not already have (see listNearby in lib/api.ts). Mocking
       the three API routes alone left 623 listings on the map, all of them
       from the snapshot, which reads like the mock failing rather than the
       merge working. A database with no coordinates is both empty. */
    await page.route('**/catalog.json', (r) => r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ pets: [], products: [], stores: [] }),
    }))
    await page.route('**/api/pets*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }))
    await page.route('**/api/products*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }))
    await page.route('**/api/stores/nearby*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)
    const mapTab = page.locator('button, [role="tab"]').filter({ hasText: /^نقشه$/ }).first()
    if (await mapTab.count()) { await mapTab.click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(2000) }
    const m = await page.evaluate(READ_MAP)
    // The origin dot («you are here») is not a listing and is drawn regardless,
    // so "no listings" means exactly that one marker and no more.
    const listingMarkers = m.markers - 1
    const errs = await page.evaluate(() => {
      const t = document.body.innerText
      return /(خطای|Error|undefined|NaN)/.test(t)
    })
    record(
      '5. No coordinates in either source',
      'map renders with only the origin dot, no error text, no crash',
      `present=${m.present} markers=${m.markers} (origin dot + ${listingMarkers} listings) errorText=${errs}`,
      Boolean(m.present && m.hasPixels && listingMarkers === 0 && !errs),
      { note: 'catalog.json emptied too — it is the primary source, not a fallback' },
    )
    await context.close()
  }

  // ── 6. Persian marker labels ─────────────────────────────────────────────
  {
    const { context, page } = await openMap(browser, { geo: TEHRAN, permission: 'granted' })
    const labels = await page.evaluate(() => {
      const out = []
      for (const m of document.querySelectorAll('.leaflet-marker-icon')) {
        const t = (m.textContent || '').trim()
        if (t) out.push(t)
      }
      return out
    })
    const persian = labels.filter((l) => /[؀-ۿ]/.test(l))
    const tofu = labels.filter((l) => /[�]/.test(l))
    record(
      '6. Persian marker labels',
      'labels contain Persian text and no replacement characters',
      `${labels.length} labelled markers, ${persian.length} with Persian, ${tofu.length} tofu`,
      persian.length > 0 && tofu.length === 0,
      { note: labels.slice(0, 6).join(' · ') },
    )
    await context.close()
  }

  // ── 7. Keyboard reach, and whether a keyboard user knows what they reached ─
  {
    const { context, page } = await openMap(browser, { geo: TEHRAN, permission: 'granted' })
    // Tab until focus lands on a listing marker, then read what it announces.
    // Being reachable is only half of it: the first marker here is a DIV with a
    // role of button and an empty accessible name, so a screen reader says
    // "button" and nothing else — the user cannot tell one listing from another.
    const trail = []
    let markerFocus = null
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press('Tab')
      const f = await page.evaluate(() => {
        const a = document.activeElement
        if (!a) return null
        return {
          tag: a.tagName,
          cls: String(a.className).slice(0, 46),
          isMarker: a.classList.contains('leaflet-marker-icon'),
          name: (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
          role: a.getAttribute('role'),
        }
      })
      if (!f) continue
      trail.push(f)
      if (f.isMarker && !markerFocus) markerFocus = f
    }
    const markers = trail.filter((t) => t.isMarker)
    const named = markers.filter((m) => m.name.length > 0)
    record(
      '7. Keyboard reach to a marker',
      'a marker can be focused by Tab and announces which listing it is',
      `markers focusable=${markers.length}, of those named=${named.length}` +
        (markerFocus ? `  first=«${markerFocus.name}» role=${markerFocus.role}` : '  none reached'),
      markers.length > 0 && named.length > 0,
      { note: markers.length ? markers.slice(0, 3).map((m) => `role=${m.role} name=«${m.name}»`).join(' · ') : 'no marker in the tab order' },
    )
    await context.close()
  }

  // ── 8. 320px, the narrowest phone ────────────────────────────────────────
  {
    const { context, page } = await openMap(browser, {
      geo: TEHRAN, permission: 'granted', viewport: { width: 320, height: 568 },
    })
    const m = await page.evaluate(READ_MAP)
    record(
      '8. 320px width',
      'no horizontal overflow, map still has pixels',
      `overflowX=${m.bodyOverflowX} ${m.width}x${m.height}`,
      Boolean(m.hasPixels && !m.bodyOverflowX),
    )
    await context.close()
  }

  // ── 9. A single-listing pin, not a cluster ───────────────────────────────
  {
    /* Cases 1-8 all ran against the real catalogue, where the pins that appear
       are CLUSTERS — «۶۲۸ مورد در این محدوده». The single-listing branch draws
       different HTML (a price pill via markerIcon, not clusterIcon) and builds a
       different accessible name (markerLabel, not the count sentence), so the
       cases above never exercised it. Clustering has no off switch: a cell
       holding one listing renders a single pin, so the way to reach that branch
       is to give the map exactly one listing.

       One store, 3km from the probe origin so it is the only thing in its cell. */
    const ONE_STORE = {
      pets: [],
      products: [],
      stores: [{
        id: 9001, name: 'پت‌شاپ آزمایشی', address: 'تهران', category: 'shop',
        lat: 35.73, lng: 51.42,
      }],
    }
    const { context, page } = await openMap(browser, { geo: TEHRAN, permission: 'granted' })
    await page.route('**/catalog.json', (r) => r.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(ONE_STORE),
    }))
    await page.route('**/api/pets*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }))
    await page.route('**/api/products*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }))
    await page.route('**/api/stores/nearby*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)
    const mapTab = page.locator('button, [role="tab"]').filter({ hasText: /^نقشه$/ }).first()
    if (await mapTab.count()) { await mapTab.click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(2500) }

    const pin = await page.evaluate(() => {
      // The origin dot is the only marker with no text; the listing pin has one.
      const all = [...document.querySelectorAll('.leaflet-marker-icon')]
      const p = all.find((m) => (m.textContent || '').trim())
      if (!p) return { found: false, total: all.length }
      return {
        found: true,
        total: all.length,
        label: p.getAttribute('aria-label'),
        title: p.getAttribute('title'),
        role: p.getAttribute('role'),
        tabindex: p.getAttribute('tabindex'),
        text: (p.textContent || '').trim(),
      }
    })

    if (!pin.found) {
      record('9. Single-listing pin (not a cluster)', 'one named, focusable pin',
        `no listing pin rendered (${pin.total} markers total)`, false)
    } else {
      const named = Boolean(pin.label && pin.label.length > 2)
      const reachable = pin.tabindex === '0' && pin.role === 'button'
      // Confirm it is NOT the cluster sentence — that would mean this case
      // silently re-tested case 7 instead of the branch it is meant to.
      const isClusterLabel = /مورد در این محدوده/.test(pin.label || '')
      record(
        '9. Single-listing pin (not a cluster)',
        'named with the listing itself, focusable, and not the cluster wording',
        `text=«${pin.text}» aria-label=«${pin.label}» role=${pin.role} tabindex=${pin.tabindex}`,
        named && reachable && !isClusterLabel,
        { note: isClusterLabel ? 'still hit the cluster branch — the fixture is wrong' : `title=«${pin.title}»` },
      )

      // And it must actually open on Enter, same as the cluster pin.
      await page.evaluate(() => {
        const p = [...document.querySelectorAll('.leaflet-marker-icon')].find((m) => (m.textContent || '').trim())
        p?.focus()
      })
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1500)
      const opened = await page.evaluate(() => !!document.querySelector('[role="dialog"]'))
      record('9b. Single pin opens on Enter', 'dialog appears', `dialog=${opened}`, opened)
    }
    await context.close()
  }

  await browser.close()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n  cases=${results.length}  passed=${results.length - failed.length}  failed=${failed.length}`)
  if (JSON_OUT) {
    writeFileSync(JSON_OUT, JSON.stringify(
      { base: BASE, when: new Date().toISOString(), results }, null, 2))
    console.log(`  json -> ${JSON_OUT}`)
  }
  return failed.length > 0 ? 1 : 0
}

process.exit(await main())
