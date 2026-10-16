/**
 * Lighthouse over the app's main routes, mobile and desktop.
 *
 *   node scripts/lighthouse_audit.mjs [--base http://127.0.0.1:5173]
 *                                     [--json out.json] [--only 1,3]
 *
 * Numbers only — the script reports what it measured and leaves the diagnosis
 * to whoever reads the table. A route below budget is not a failure of this
 * script; it is a row with a number in it.
 *
 * Lighthouse spawns its own Chrome. The bundled Chromium cannot be fetched
 * on this network (403 by geography), so chrome-launcher is pointed at the
 * installed Chrome through CHROME_PATH.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import lighthouse from 'lighthouse'

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean)

const CHROME_PATH = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!CHROME_PATH) {
  console.error('no Chrome found; set CHROME_PATH')
  process.exit(2)
}

const ROUTES = [
  { route: '/', label: 'خانه', auth: false },
  { route: '/explore', label: 'کاوش روی نقشه', auth: false },
  { route: '/explore?preset=vets', label: 'خدمات دامپزشکی', auth: false },
  { route: '/pets', label: 'حیوانات نزدیک', auth: false },
  { route: '/adoption', label: 'سرپرستی', auth: false },
  { route: '/feed', label: 'لحظه‌ها', auth: true },
  { route: '/bookings', label: 'نوبت‌های من', auth: true },
  { route: '/me', label: 'حساب من', auth: true },
]

const BUDGET = {
  performance: 90,
  accessibility: 95,
  lcp: 2500,     // ms
  cls: 0.1,
  inp: 200,      // ms — reported as TBT when the page is quiet
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg('base', 'http://127.0.0.1:5173')
const JSON_OUT = arg('json', '')
const TOKEN = arg('token', process.env.PAWS_TOKEN ?? '')
const ONLY = arg('only', '')
/* CI has no database, no backend and no session. The guarded routes would
   bounce to /login there, and measuring the login page under the name of three
   others is worse than not measuring them — see the same flag in
   a11y_audit.mjs. This drops them from the list rather than skipping them. */
const PUBLIC_ONLY = process.argv.includes('--public-only')
const MEASURED = PUBLIC_ONLY ? ROUTES.filter((r) => !r.auth) : ROUTES

// Lighthouse opens its own tab, so the session has to already live in the
// running browser rather than in a profile this script controls. Connecting
// over CDP and writing localStorage once is enough — it is per-origin and
// survives the tab Lighthouse throws away.
async function seedSession(cdpPort) {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0] ?? await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.evaluate((t) => localStorage.setItem('pawsmarket-auth-token', t), TOKEN)
  await page.close()
  // Do not close the browser: it is not ours, and Lighthouse needs it next.
  await browser.close()
}

function scoreOf(lhr, id) {
  const a = lhr.audits[id]
  if (!a) return null
  if (typeof a.numericValue === 'number') return a.numericValue
  return a.score
}

async function runOne(route, formFactor, port) {
  const options = {
    port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor,
    screenEmulation: formFactor === 'mobile'
      ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false }
      : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttlingMethod: 'simulate',
  }
  const runner = await lighthouse(BASE + route, options)
  const lhr = runner.lhr
  // A zero-score run means Lighthouse never connected — it reports 0 rather
  // than throwing, which is how the first pass here produced a table of zeros
  // that looked like a catastrophically slow site. Fail loudly instead.
  if (!lhr || !lhr.categories.performance) {
    throw new Error('lighthouse returned no report (chrome unreachable?)')
  }
  return {
    perf: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    a11y: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
    bp: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
    seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
    lcp: scoreOf(lhr, 'largest-contentful-paint'),
    cls: scoreOf(lhr, 'cumulative-layout-shift'),
    tbt: scoreOf(lhr, 'total-blocking-time'),
    // The top opportunities by wasted ms, so a number in the table has a
    // named cause attached without a second run.
    opportunities: Object.values(lhr.audits)
      .filter((a) => a.details?.type === 'opportunity' && a.numericValue > 200)
      .sort((a, b) => b.numericValue - a.numericValue)
      .slice(0, 3)
      .map((a) => ({ id: a.id, ms: Math.round(a.numericValue) })),
  }
}

async function main() {
  // One Chrome with a persistent profile, reused across routes: starting a
  // fresh one per route is slower and loses the seeded session each time.
  // Chrome is started outside this script and reached over CDP.
  //
  // chrome-launcher cannot start one here: it writes chrome.pid into the
  // profile directory without creating it first (ENOENT), and once that is
  // worked around, the port it picks on this machine falls inside Windows'
  // excluded ranges often enough to look like a flaky audit. An externally
  // started Chrome on a known port removes both problems, and matches how
  // the axe script already works.
  const CDP_PORT = Number(arg('cdp', '9777'))
  const probe = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)
    .then((r) => r.json())
    .catch(() => null)
  if (!probe) {
    console.error(
      `no Chrome on 127.0.0.1:${CDP_PORT}.\n` +
      'start one first:\n' +
      `  & "${CHROME_PATH}" --remote-debugging-port=${CDP_PORT}` +
      ' --user-data-dir=%TEMP%/paws-lh --headless=new --disable-gpu about:blank')
    process.exit(2)
  }
  console.log(`  chrome ${probe.Browser} on ${CDP_PORT}`)

  if (TOKEN) {
    console.log('  seeding session via the app origin...')
    await seedSession(CDP_PORT)
  }

  const rows = []
  const only = ONLY ? new Set(ONLY.split(',').map(Number)) : null
  if (PUBLIC_ONLY) {
    console.log(`  --public-only: ${MEASURED.length} of ${ROUTES.length} routes` +
      ' (guarded ones need a session and are not measured here)')
  }

  for (const [i, r] of MEASURED.entries()) {
    if (only && !only.has(i + 1)) continue
    for (const ff of ['mobile', 'desktop']) {
      try {
        const m = await runOne(r.route, ff, CDP_PORT)
        rows.push({ ...r, form: ff, ok: true, ...m })
        console.log(
          `  ${String(i + 1).padStart(2)}. ${r.route.padEnd(24)} ${ff.padEnd(8)}` +
          ` perf=${String(m.perf).padStart(3)} a11y=${String(m.a11y).padStart(3)}` +
          ` LCP=${m.lcp ? (m.lcp / 1000).toFixed(2) + 's' : '-'}` +
          ` CLS=${m.cls?.toFixed(3) ?? '-'}` +
          ` TBT=${m.tbt ? Math.round(m.tbt) + 'ms' : '-'}`,
        )
      } catch (err) {
        const msg = String(err).split('\n')[0].slice(0, 140)
        rows.push({ ...r, form: ff, ok: false, error: msg })
        console.log(`  ${String(i + 1).padStart(2)}. ${r.route.padEnd(24)} ${ff.padEnd(8)} FAILED: ${msg}`)
      }
    }
  }

  // The browser is not ours to kill — it was started outside this script.

  console.log('\n  budget check (mobile rows are the ones that matter):')
  const misses = []
  for (const m of rows.filter((r) => r.ok)) {
    const bad = []
    if (m.perf < BUDGET.performance) bad.push(`perf ${m.perf}<${BUDGET.performance}`)
    if (m.a11y < BUDGET.accessibility) bad.push(`a11y ${m.a11y}<${BUDGET.accessibility}`)
    if (m.lcp && m.lcp > BUDGET.lcp) bad.push(`LCP ${(m.lcp / 1000).toFixed(2)}s`)
    if (m.cls != null && m.cls > BUDGET.cls) bad.push(`CLS ${m.cls.toFixed(3)}`)
    if (m.tbt && m.tbt > BUDGET.inp) bad.push(`TBT ${Math.round(m.tbt)}ms`)
    if (bad.length) misses.push({ route: m.route, form: m.form, bad, ops: m.opportunities })
  }
  if (!misses.length) {
    console.log('    every measured route is inside budget')
  } else {
    for (const x of misses) {
      console.log(`    ${x.route} [${x.form}] ${x.bad.join(', ')}`)
      for (const o of x.ops) console.log(`        ${o.id}: ${o.ms}ms`)
    }
  }

  if (JSON_OUT) {
    writeFileSync(JSON_OUT, JSON.stringify(
      { base: BASE, when: new Date().toISOString(), budget: BUDGET, rows }, null, 2))
    console.log(`\n  json -> ${JSON_OUT}`)
  }
  return 0
}

process.exit(await main())
