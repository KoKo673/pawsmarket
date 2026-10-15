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
 * Exit code is 1 when any critical+serious violation was found, 2 when a
 * route failed to load, 0 when clean — usable as a CI gate.
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
      entry = { route, label, auth, ok: true, byImpact, violations: detail }
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
      (entry.ok ? '' : `  ${entry.error}`),
    )
  }

  const failed = results.filter((r) => !r.ok)
  const gatingTotal = results.reduce(
    (n, r) => n + (r.ok ? r.byImpact.critical + r.byImpact.serious : 0), 0)

  console.log('\n  route-by-route violations (gating = critical+serious):')
  for (const r of results) {
    if (!r.ok) {
      console.log(`    ${r.route}  SKIPPED: ${r.error}`)
      continue
    }
    const g = r.byImpact.critical + r.byImpact.serious
    if (g === 0 && r.byImpact.moderate + r.byImpact.minor === 0) {
      console.log(`    ${r.route}  clean`)
      continue
    }
    console.log(`    ${r.route}  gating=${g}`)
    for (const v of r.violations) {
      console.log(`        [${v.impact}] ${v.id} ×${v.nodes} — ${v.help}`)
      if (v.impact !== 'minor') console.log(`            ${v.sample}`)
    }
  }

  console.log(
    `\n  routes=${results.length}  audited=${results.length - failed.length}` +
    `  skipped=${failed.length}  gating_violations=${gatingTotal}`)

  if (JSON_OUT) {
    writeFileSync(JSON_OUT, JSON.stringify(
      { base: BASE, when: new Date().toISOString(), results }, null, 2))
    console.log(`  json -> ${JSON_OUT}`)
  }

  return failed.length > 0 ? 2 : (gatingTotal > 0 ? 1 : 0)
}

process.exit(await main())
