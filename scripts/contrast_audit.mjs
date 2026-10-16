/**
 * Contrast audit that does not depend on axe, and does not depend on what is
 * painted on top of a node.
 *
 * Why this exists next to `a11y_audit.mjs`:
 *
 * axe resolves a text node's background by looking at what is painted behind
 * it. The listing card is one control whose transparent button is stretched
 * over the whole card (`absolute inset-0`), and that overlay made axe unable
 * to resolve the background of every price, title and address inside it. Those
 * nodes did not disappear from axe's report — they moved into `incomplete`,
 * which a report reading only `violations` drops silently. The card fix went
 * out reporting the page clean while 44 visible failures sat behind it.
 *
 * This walks every text node instead, computes the ratio from the node's own
 * computed style, and composites translucent backgrounds by hand. Nothing is
 * stacked over anything else as far as this is concerned, so an overlay cannot
 * hide a failure from it.
 *
 * What it does NOT know, and axe does:
 *   - images and gradients. `background-color` is transparent under a
 *     `bg-gradient-to-br`, so the walk up the tree skips the banner entirely
 *     and lands on the page. Nodes where a gradient or an image sits between
 *     the text and its resolved background are reported as `unresolved`
 *     instead of judged, because a wrong number is worse than no number.
 *     (This is exactly the false positive that reported the home banner at
 *     1.04 — white on white — when the real pixel ratio was 3.22.)
 *   - text rendered by a pseudo-element or a canvas.
 *   - anything inside a shadow root or an iframe.
 *
 *   node scripts/contrast_audit.mjs [--base http://127.0.0.1:4173]
 *                                   [--token <session token>]
 *                                   [--json out.json]
 *
 * Exit code is 1 when any visible text fails, 2 when a route failed to load,
 * 0 when clean.
 */
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const ROUTES = [
  { route: '/', label: 'خانه', auth: false },
  { route: '/explore', label: 'کاوش روی نقشه', auth: false },
  { route: '/explore?preset=vets', label: 'خدمات دامپزشکی', auth: false },
  { route: '/pets', label: 'حیوانات نزدیک', auth: false },
  { route: '/adoption', label: 'سرپرستی', auth: false },
  { route: '/feed', label: 'لحظه‌ها', auth: true },
  { route: '/bookings', label: 'نوبت‌های من', auth: true },
  { route: '/me', label: 'حساب من', auth: true },
  { route: '/pet/1', label: 'پروفایل حیوان', auth: false },
  { route: '/add', label: 'ثبت آگهی', auth: false },
]

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg('base', 'http://127.0.0.1:4173')
const TOKEN = arg('token', process.env.PAWS_TOKEN ?? '')
const JSON_OUT = arg('json', '')
/* CI has no database, no backend and no session: the guarded routes would
   bounce to /login and the login page would be measured under their names.
   Dropping them from the list is not the same as skipping them — a skip still
   fails the run, and it would be failing about the environment. */
const PUBLIC_ONLY = process.argv.includes('--public-only')

/**
 * Prefer the installed Chrome, fall back to Playwright's bundled Chromium.
 *
 * The bundled browser cannot be downloaded from an Iranian network
 * (cdn.playwright.dev answers 403 "not available in your location"), so local
 * runs need system Chrome. CI runs on GitHub's servers, where that block does
 * not apply and where Chrome is not installed — the bundled browser is both
 * reachable and the only option there. Trying Chrome first keeps one script
 * working in both places.
 */
async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true })
  } catch {
    return await chromium.launch({ headless: true })
  }
}

/**
 * Runs in the page: returns every text node's computed foreground, resolved
 * background and WCAG ratio.
 *
 * Self-contained on purpose — `page.evaluate` serialises this function into
 * the browser, so it cannot close over anything from this file.
 */
function collectTextContrast() {
  const srgb = (c) => {
    c /= 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const lum = (p) => 0.2126 * srgb(p[0]) + 0.7152 * srgb(p[1]) + 0.0722 * srgb(p[2])
  const ratio = (a, b) => {
    const la = lum(a), lb = lum(b)
    const hi = Math.max(la, lb), lo = Math.min(la, lb)
    return (hi + 0.05) / (lo + 0.05)
  }
  const parse = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    if (p.length < 3 || p.some(Number.isNaN)) return null
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]
  }
  const over = (fg, bg) => {
    const a = fg[3]
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a))
  }

  /* Walk up compositing every translucent layer until an opaque one. Returns
     null when a gradient or an image is in the way: those paint something this
     cannot read, and guessing the page background underneath would be a lie. */
  const bgOf = (el) => {
    const stack = []
    let opaque = null
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null
      const c = parse(cs.backgroundColor)
      if (c && c[3] > 0.001) {
        stack.push(c)
        if (c[3] >= 0.999) { opaque = true; break }
      }
    }
    if (!opaque) stack.push([255, 255, 255, 1])
    let acc = stack.pop().slice(0, 3)
    while (stack.length) acc = over(stack.pop(), acc)
    return acc
  }

  const out = []
  for (const el of document.querySelectorAll('*')) {
    // Text this element owns itself, so a parent is not blamed for a child's
    // colour (and so text split across inline children is still caught).
    let own = ''
    for (const n of el.childNodes) if (n.nodeType === 3) own += n.nodeValue
    own = own.trim()
    if (!own) continue

    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const op = parseFloat(cs.opacity)
    if (op < 0.05) continue
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue

    const bg = bgOf(el)
    const fg = parse(cs.color)
    if (!fg) continue

    if (!bg) {
      out.push({
        text: own.slice(0, 40), unresolved: 'gradient or image behind the text',
        px: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight, 10) || 400,
        color: cs.color,
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 90),
        tag: el.tagName, inViewport: r.top < window.innerHeight && r.bottom > 0,
      })
      continue
    }

    // Fold the element's own opacity into the foreground, so a node caught
    // mid-pulse is judged by what the reader actually sees at that moment.
    const painted = over([fg[0], fg[1], fg[2], fg[3] * op], bg)
    const cr = ratio(painted, bg)
    const px = parseFloat(cs.fontSize)
    const weight = parseInt(cs.fontWeight, 10) || 400
    // WCAG "large text": >=24px, or >=18.66px at weight >=700. Nothing else.
    const large = px >= 24 || (px >= 18.66 && weight >= 700)
    const need = large ? 3 : 4.5

    out.push({
      text: own.slice(0, 40),
      ratio: Math.round(cr * 100) / 100,
      need,
      px, weight,
      opacity: Math.round(op * 1000) / 1000,
      animation: cs.animationName !== 'none' ? cs.animationName : null,
      color: cs.color,
      bg: `rgb(${bg.map(Math.round).join(',')})`,
      cls: (typeof el.className === 'string' ? el.className : '').slice(0, 90),
      tag: el.tagName,
      fails: cr < need,
      inViewport: r.top < window.innerHeight && r.bottom > 0,
    })
  }
  return out
}

async function auditRoute(browser, { route, label, auth }) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'fa-IR',
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
    // The entrance motion fades sections in; a node sampled at opacity 0 would
    // be judged as invisible and skipped.
    await page.waitForTimeout(1200)

    const want = route.split('?')[0]
    const landed = new URL(page.url()).pathname
    if (landed !== want) {
      entry.error = `redirected to ${landed}${TOKEN ? '' : ' (needs --token)'}`
    } else {
      const nodes = await page.evaluate(collectTextContrast)
      const failing = nodes.filter((n) => n.fails)
      const unresolved = nodes.filter((n) => n.unresolved)
      entry = {
        route, label, auth, ok: true,
        counts: { textNodes: nodes.length, failing: failing.length, unresolved: unresolved.length },
        failing, unresolved,
      }
    }
  } catch (err) {
    entry = { route, label, auth, ok: false, error: String(err).split('\n')[0].slice(0, 160) }
  }
  await context.close()
  return entry
}

/**
 * The documented brand exception — see the long note in a11y_audit.mjs.
 *
 * White on `--primary` (#fa5705) is 3.27 where the text needs 4.5, on every
 * primary button in the app at every size. Enlarging does not help: WCAG's
 * "large text" starts at 18.66px with weight >=700, and the Button base weight
 * is 600, so sm/default/lg all need 4.5. The real fix is the
 * `--primary-foreground` token, which repaints every primary button and is
 * parked for the product owner.
 *
 * Matched on the fill and the text colour, not the size — one token, one
 * exception. Delete this, and the matching block in a11y_audit.mjs, when the
 * token moves.
 */
function isBrandException(f) {
  return f.bg === 'rgb(250,87,5)' && f.color === 'rgb(255, 255, 255)'
}

async function main() {
  const browser = await launchBrowser()
  const results = []
  const measured = PUBLIC_ONLY ? ROUTES.filter((r) => !r.auth) : ROUTES
  if (PUBLIC_ONLY) {
    console.log(`  --public-only: ${measured.length} of ${ROUTES.length} routes` +
      ' (guarded ones need a session and are not measured here)')
  }

  for (const spec of measured) {
    const entry = await auditRoute(browser, spec)
    results.push(entry)
    if (!entry.ok) {
      console.log(`  ${spec.route.padEnd(24)} SKIPPED: ${entry.error}`)
      continue
    }
    const { unresolved } = entry
    const failing = entry.failing.filter((f) => !isBrandException(f))
    const excused = entry.failing.length - failing.length
    entry.gating = failing
    entry.excused = excused
    const worst = failing.reduce((m, f) => (m === null || f.ratio < m ? f.ratio : m), null)
    console.log(
      `  ${spec.route.padEnd(24)} failing=${String(failing.length).padStart(3)}` +
      ` of ${String(entry.counts.textNodes).padStart(4)} text nodes` +
      `  worst=${worst === null ? '—' : worst}` +
      (entry.counts.unresolved ? `  unresolved=${entry.counts.unresolved}` : '') +
      (excused ? `  brand_exception=${excused}` : ''),
    )
  }

  await browser.close()

  console.log('\n  failures grouped by cause (ratio, size, colours):')
  for (const r of results) {
    if (!r.ok || r.gating.length === 0) continue
    const grouped = new Map()
    for (const f of r.gating) {
      const k = `${f.ratio}|${f.px}/${f.weight}|${f.color}|${f.bg}|${f.animation ?? '-'}`
      if (!grouped.has(k)) grouped.set(k, { ...f, count: 0, samples: [] })
      const g = grouped.get(k)
      g.count++
      if (g.samples.length < 3) g.samples.push(f.text)
    }
    console.log(`\n    ${r.route} — ${r.gating.length} node(s)`)
    for (const g of [...grouped.values()].sort((a, b) => a.ratio - b.ratio)) {
      console.log(
        `      ×${String(g.count).padStart(3)}  ${String(g.ratio).padStart(5)} (need ${g.need})` +
        `  ${g.px}px/${g.weight}  ${g.color} on ${g.bg}` +
        (g.animation ? `  anim=${g.animation}` : '') +
        (g.opacity < 1 ? `  op=${g.opacity}` : ''),
      )
      console.log(`            .${g.cls}`)
      console.log(`            «${g.samples.join('» «')}»`)
    }
  }

  const skipped = results.filter((r) => !r.ok)
  const totalFailing = results.reduce((n, r) => n + (r.ok ? r.gating.length : 0), 0)
  const totalExcused = results.reduce((n, r) => n + (r.ok ? r.excused : 0), 0)
  const totalUnresolved = results.reduce((n, r) => n + (r.ok ? r.counts.unresolved : 0), 0)

  if (totalExcused > 0) {
    console.log(`\n  ${totalExcused} node(s) are the documented brand exception` +
      ' (white on --primary, 3.27) and are reported but not gated.')
  }

  console.log(
    `\n  routes=${results.length}  audited=${results.length - skipped.length}` +
    `  skipped=${skipped.length}  failing_text_nodes=${totalFailing}` +
    (totalExcused ? `  brand_exception=${totalExcused}` : '') +
    (totalUnresolved ? `  unresolved=${totalUnresolved}` : ''))

  if (JSON_OUT) {
    writeFileSync(JSON_OUT, JSON.stringify(
      { base: BASE, when: new Date().toISOString(), results }, null, 2))
    console.log(`  json -> ${JSON_OUT}`)
  }

  return skipped.length > 0 ? 2 : (totalFailing > 0 ? 1 : 0)
}

process.exit(await main())
