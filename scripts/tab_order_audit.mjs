/**
 * Walk the keyboard through each route and report what a screen reader would
 * announce at every stop.
 *
 * Why this exists alongside axe: axe checks that controls HAVE names, not that
 * the names are usable. It cannot tell you that a control is nameless but
 * focusable, that a name is a wall of unseparated text, or that the tab order
 * runs against the reading order. All three need the interaction to actually
 * happen.
 *
 *   node scripts/tab_order_audit.mjs [--base http://127.0.0.1:4173]
 *                                   [--token <session token>]
 *                                   [--public-only]
 *                                   [--json out.json]
 *                                   [--stops 30]
 *
 * What it reports per stop: tag, role, the accessible name, and whether that
 * name is present at all. Exit code is 1 when a focusable control has no name,
 * 2 when a route could not be loaded, 0 when clean.
 *
 * The names come from `innerText`, not `textContent`. The difference matters
 * and cost an hour once: textContent concatenates children with no separator,
 * so «۱۱ کیلومتر Rex سگ» reads as «۱۱ کیلومترRexسگ» and looks like a bug in
 * the page when it is a bug in the measurement. innerText is what the browser
 * uses for the accessible name and it preserves the breaks.
 *
 * NOT automated here, and left to scripts/screen_reader_smoke.md: whether a
 * name that IS present is understandable, and whether the pauses fall in
 * sensible places. A machine can tell you a control is called «ذخیرهی آگهی»;
 * only listening tells you that is a good name.
 */
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg('base', 'http://127.0.0.1:4173')
const TOKEN = arg('token', process.env.PAWS_TOKEN ?? '')
const JSON_OUT = arg('json', '')
const MAX_STOPS = Number(arg('stops', '30'))
const PUBLIC_ONLY = process.argv.includes('--public-only')

const ROUTES = [
  { route: '/', label: 'خانه', auth: false },
  { route: '/explore', label: 'کاوش روی نقشه', auth: false },
  { route: '/pets', label: 'حیوانات نزدیک', auth: false },
  { route: '/adoption', label: 'سرپرستی', auth: false },
  { route: '/login', label: 'ورود', auth: false },
  { route: '/register', label: 'ثبت‌نام', auth: false },
  { route: '/me', label: 'حساب من', auth: true },
]

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true })
  } catch {
    return await chromium.launch({ headless: true })
  }
}

/** One tab stop, described the way assistive tech would see it. */
function readFocus() {
  const a = document.activeElement
  if (!a || a === document.body || a === document.documentElement) return null
  // innerText, never textContent — see the note at the top of this file.
  const name = (a.getAttribute('aria-label') || a.innerText || '').replace(/\s+/g, ' ').trim()
  const rect = a.getBoundingClientRect()
  /* A focus stop with no visible box is focusable but invisible — the reader
     lands somewhere they cannot see. `display:none` and zero-size both land
     here, and neither is caught by a name check. */
  const visible = rect.width > 1 && rect.height > 1
  return {
    tag: a.tagName,
    role: a.getAttribute('role') || null,
    name: name.slice(0, 90),
    named: name.length > 0,
    visible,
    // The outline is how a keyboard user knows where they are.
    hasFocusRing: getComputedStyle(a).outlineStyle !== 'none',
  }
}

async function auditRoute(browser, { route, label, auth }) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, locale: 'fa-IR', isMobile: true, hasTouch: true,
  })
  if (auth && TOKEN) {
    await context.addInitScript((t) => {
      try { localStorage.setItem('pawsmarket-auth-token', t) } catch {}
    }, TOKEN)
  }
  const page = await context.newPage()
  let entry = { route, label, auth, ok: false }
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
    await page.waitForTimeout(2000)

    const want = route.split('?')[0]
    const landed = new URL(page.url()).pathname
    if (landed !== want) {
      entry.error = `redirected to ${landed}${TOKEN ? '' : ' (needs --token)'}`
    } else {
      // Start from the top so the first Tab is the first control.
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.keyboard.press('Tab')
      const stops = []
      for (let i = 0; i < MAX_STOPS; i++) {
        const s = await page.evaluate(readFocus)
        if (s) stops.push(s)
        await page.keyboard.press('Tab')
        // Stop early once focus wraps back to the top.
        const wrapped = await page.evaluate(() => {
          const a = document.activeElement
          return a === document.body || a?.tagName === 'BODY'
        })
        if (wrapped) break
      }
      entry = {
        route, label, auth, ok: true,
        stops,
        unnamed: stops.filter((s) => !s.named).length,
        invisible: stops.filter((s) => !s.visible).length,
        noFocusRing: stops.filter((s) => !s.hasFocusRing).length,
      }
    }
  } catch (err) {
    entry = { route, label, auth, ok: false, error: String(err).split('\n')[0].slice(0, 160) }
  }
  await context.close()
  return entry
}

async function main() {
  const routes = PUBLIC_ONLY ? ROUTES.filter((r) => !r.auth) : ROUTES
  if (PUBLIC_ONLY) {
    console.log(`  --public-only: ${routes.length} of ${ROUTES.length} routes` +
      ' (guarded ones need a session)')
  }

  const browser = await launchBrowser()
  const results = []
  for (const spec of routes) {
    const entry = await auditRoute(browser, spec)
    results.push(entry)
    if (!entry.ok) {
      console.log(`  ${spec.route.padEnd(22)} SKIPPED: ${entry.error}`)
      continue
    }
    console.log(
      `  ${spec.route.padEnd(22)} stops=${String(entry.stops.length).padStart(3)}` +
      `  unnamed=${entry.unnamed}` +
      (entry.invisible ? `  invisible=${entry.invisible}` : '') +
      (entry.noFocusRing ? `  no-ring=${entry.noFocusRing}` : ''),
    )
  }
  await browser.close()

  /* A stop with no name is the one thing a screen reader cannot describe at
     all, so it is what gates. The other two are reported: an outline can be
     drawn by :focus-visible and missed by the computed style, and an invisible
     stop is worth seeing before it is worth failing a build over. */
  for (const r of results) {
    if (!r.ok) continue
    const bad = r.stops.filter((s) => !s.named)
    if (bad.length === 0) continue
    console.log(`\n    ${r.route} — ${bad.length} unnamed stop(s)`)
    for (const s of bad) {
      console.log(`      ${s.tag} role=${s.role ?? '-'} visible=${s.visible}`)
    }
  }

  const skipped = results.filter((r) => !r.ok)
  const totalUnnamed = results.reduce((n, r) => n + (r.ok ? r.unnamed : 0), 0)
  const totalStops = results.reduce((n, r) => n + (r.ok ? r.stops.length : 0), 0)

  console.log(
    `\n  routes=${results.length}  audited=${results.length - skipped.length}` +
    `  skipped=${skipped.length}  tab_stops=${totalStops}  unnamed=${totalUnnamed}`)

  if (JSON_OUT) {
    writeFileSync(JSON_OUT, JSON.stringify(
      { base: BASE, when: new Date().toISOString(), results }, null, 2))
    console.log(`  json -> ${JSON_OUT}`)
  }

  return skipped.length > 0 ? 2 : (totalUnnamed > 0 ? 1 : 0)
}

process.exit(await main())
