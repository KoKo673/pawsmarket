/**
 * axe-core audit over the app's main routes.
 *
 * Runs the real axe engine (via playwright) against a running dev server.
 * Playwright's bundled Chromium cannot be downloaded from this network —
 * cdn.playwright.dev answers 403 "not available in your location" — so the
 * browser comes from `channel: 'chrome'`, which drives the Chrome already
 * installed on the machine.
 *
 *   node scripts/a11y_audit.mjs [--base http://127.0.0.1:5173] [--json out.json]
 *                              [--token <session token>]
 *
 * Routes differ in who may see them:
 *   public   — anyone, audited as a signed-out visitor
 *   authed   — behind RequireAuth; without a token they 302 to
 *              /login?next=… and auditing them would silently measure the
 *              login page three times under three names.
 *   role     — the page changes shape by role. /bookings shows the customer
 *              view; /me only shows pet cards to an account that owns pets.
 *
 * Exit code is 1 when any critical+serious violation was found — or any
 * unresolved contrast failure, see below — 2 when a route failed to load,
 * 0 when clean. Usable as a CI gate.
 */
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

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

// Anything below 'serious' is reported but does not fail the run: this
// codebase has known moderate issues (landmark structure on a couple of
// pages) and gating on them would make the number stop meaning anything.
const GATING = new Set(['critical', 'serious'])

/**
 * Is this selector's element one a person can see at all?
 *
 * A contrast node axe could not measure only matters if it renders. axe also
 * parks unresolvable nodes nobody can see — transparent elements, ones clipped
 * to nothing, ones behind `display:none` — and failing on those would make the
 * gate cry wolf until people stopped reading it.
 *
 * Deliberately narrow: rendered (non-zero box, not display:none/visibility:
 * hidden, not effectively transparent, not aria-hidden) and scrolled to
 * something a person can reach. It makes no attempt to detect occlusion — an
 * element sitting *under* something else still counts as visible, which is the
 * whole point, since that is the case that hid 44 failures behind the listing
 * card's transparent button.
 *
 * Viewport is NOT part of the test. `/explore` puts 188 unresolved nodes in
 * `incomplete` and only 6 of them are on the first screen; the other 182 are
 * below the fold and a reader scrolls straight to them. Gating on "currently
 * painted" would report 13 problems where the user meets 147, and would let a
 * fix pass by moving content down the page. `violations` has never been
 * viewport-limited either, so this keeps the two lists consistent.
 *
 * Returns null when the selector matches nothing (a shadow-DOM or iframe
 * target), which the report keeps as "unknown" rather than passing off as
 * either visible or hidden.
 */
function visibleInPage(page, selector) {
  return page.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return null
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return false
      if (parseFloat(cs.opacity) < 0.05) return false
      if (n.getAttribute('aria-hidden') === 'true') return false
    }
    const r = el.getBoundingClientRect()
    // A zero-area box is not rendered, whatever its ancestors say. Height is
    // checked but top/left are not: off-screen and negative coordinates are
    // still on the document.
    return r.width >= 1 && r.height >= 1
  }, selector).catch(() => null)
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg('base', 'http://127.0.0.1:5173')
const JSON_OUT = arg('json', '')
const TOKEN = arg('token', process.env.PAWS_TOKEN ?? '')

// The app talks to a real backend; a route that renders its skeleton or an
// error block has nothing to audit. Wait for the network to go quiet, then
// give the entrance animations a beat to settle.
async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
  await page.waitForTimeout(700)
}

/**
 * Audit one route in its own browser and return the entry.
 *
 * A separate function rather than an inline loop body on purpose: guarded
 * routes kept bouncing to /login when audited inside main()'s loop, while the
 * identical sequence — own browser, context-level init script, same waits —
 * passes when run on its own. Rather than guess at the difference, the audit
 * is split so each route gets a clean process-shaped run and the guarded ones
 * are exercised exactly the way that was proven to work.
 */
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
    await settle(page)

    const want = route.split('?')[0]
    const landed = new URL(page.url()).pathname
    if (landed !== want) {
      entry.error = `redirected to ${landed}${TOKEN ? '' : ' (needs --token)'}`
    } else {
      const res = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 }
      const detail = []
      for (const v of res.violations) {
        byImpact[v.impact ?? 'minor'] += v.nodes.length
        detail.push({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          help: v.help,
          sample: v.nodes[0]?.target?.join(' ')?.slice(0, 120) ?? '',
        })
      }
      detail.sort((a, b) => (a.impact > b.impact ? -1 : a.impact < b.impact ? 1 : 0))

      /* ——— the guard ———
         axe moves every node it cannot resolve out of `violations` and into
         `incomplete`, and a report that reads only the first list silently
         drops them. That is not hypothetical: the transparent button stretched
         over each listing card (so the card is one control) put 44 real
         contrast failures into `incomplete` with "background color could not
         be determined because it is overlapped by another element", and the
         audit went on reporting the page clean.

         So anything unresolved is now checked for whether a person could see
         it, and a visible one fails the run. The count is reported either way,
         because "axe could not tell" is information the reader needs even when
         it does not gate. */
      const unresolved = []
      let unresolvedVisible = 0
      for (const v of res.incomplete ?? []) {
        if (v.id !== 'color-contrast') continue
        for (const n of v.nodes) {
          const sel = n.target?.[0]
          const seen = typeof sel === 'string' ? await visibleInPage(page, sel) : null
          const reason = (n.any?.[0]?.message ?? n.all?.[0]?.message ?? n.failureSummary ?? '')
            .replace(/\s+/g, ' ').slice(0, 170)
          /* Not every `incomplete` is our doing. axe also gives up on things
             nobody can fix from the colour tokens — an empty input whose
             placeholder it refuses to judge without a value, for instance.
             Gating on those would leave the gate permanently red for a reason
             no fix can clear, and a gate nobody can clear stops being read.
             The one axe gives up on *because of us* is occlusion, which is
             exactly the failure this guard exists to catch, so that is what
             gates. The rest is reported and left alone. */
          const ourDoing = /overlapped by another element/i.test(reason)
          unresolved.push({
            target: n.target?.join(' ')?.slice(0, 140) ?? '',
            reason,
            visible: seen,
            gating: Boolean(seen) && ourDoing,
          })
          if (seen && ourDoing) unresolvedVisible++
        }
      }

      entry = {
        route, label, auth, ok: true, byImpact, violations: detail,
        unresolved, unresolvedVisible,
      }
    }
  } catch (err) {
    entry = { route, label, auth, ok: false, error: String(err).split('\n')[0].slice(0, 160) }
  }
  await context.close()
  return entry
}

async function main() {
  const results = []
  for (const spec of ROUTES) {
    const browser = await chromium.launch({ channel: 'chrome', headless: true })
    const entry = await auditRoute(browser, spec)
    await browser.close()
    results.push(entry)

    console.log(
      `  ${spec.route.padEnd(24)} crit=${entry.ok ? entry.byImpact.critical : '-'}` +
      ` serious=${entry.ok ? entry.byImpact.serious : '-'}` +
      ` moderate=${entry.ok ? entry.byImpact.moderate : '-'}` +
      ` minor=${entry.ok ? entry.byImpact.minor : '-'}` +
      ` unmeasured=${entry.ok ? entry.unresolvedVisible : '-'}` +
      (entry.ok ? '' : `  ${entry.error}`),
    )
  }

  const failed = results.filter((r) => !r.ok)
  const gatingTotal = results.reduce(
    (n, r) => n + (r.ok ? r.byImpact.critical + r.byImpact.serious : 0), 0)
  const unmeasuredVisible = results.reduce(
    (n, r) => n + (r.ok ? r.unresolvedVisible : 0), 0)
  const unmeasured = results.reduce(
    (n, r) => n + (r.ok ? r.unresolved.length : 0), 0)

  console.log('\n  route-by-route violations (gating = critical+serious):')
  for (const r of results) {
    if (!r.ok) {
      console.log(`    ${r.route}  SKIPPED: ${r.error}`)
      continue
    }
    const g = r.byImpact.critical + r.byImpact.serious
    const clean = g === 0 && r.byImpact.moderate + r.byImpact.minor === 0
    if (clean && r.unresolvedVisible === 0) {
      console.log(`    ${r.route}  clean`)
      continue
    }
    console.log(`    ${r.route}  gating=${g}` +
      (r.unresolvedVisible ? `  UNMEASURED_VISIBLE=${r.unresolvedVisible}` : ''))
    for (const v of r.violations) {
      console.log(`        [${v.impact}] ${v.id} ×${v.nodes} — ${v.help}`)
      if (v.impact !== 'minor') console.log(`            ${v.sample}`)
    }
    for (const u of r.unresolved) {
      if (u.visible === false) continue
      const mark = u.gating ? 'GATING' : 'not-our-fix'
      console.log(`        [unmeasured/${mark}] ${u.target}`)
      console.log(`            ${u.reason}`)
    }
  }

  if (unmeasured > 0 && unmeasuredVisible === 0) {
    console.log(`\n  ${unmeasured} contrast node(s) axe could not measure, none of them` +
      ' caused by an overlay — reported, not gated.')
  }

  console.log(
    `\n  routes=${results.length}  audited=${results.length - failed.length}` +
    `  skipped=${failed.length}  gating_violations=${gatingTotal}` +
    `  unmeasured_visible=${unmeasuredVisible}`)

  if (JSON_OUT) {
    writeFileSync(JSON_OUT, JSON.stringify(
      { base: BASE, when: new Date().toISOString(), results }, null, 2))
    console.log(`  json -> ${JSON_OUT}`)
  }

  return failed.length > 0 ? 2
    : (gatingTotal > 0 || unmeasuredVisible > 0) ? 1
    : 0
}

process.exit(await main())
