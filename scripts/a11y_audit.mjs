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

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })

  const results = []
  for (const { route, label, auth } of ROUTES) {
    // A context per route, not one shared context. Reusing it made guarded
    // routes intermittently bounce to /login even with a valid token sitting
    // in localStorage — reproduced 5 times out of 5 in one sequence and never
    // in isolation, so it belongs to the harness (page teardown interfering
    // with the next route's auth hydrate) rather than to the app. An isolated
    // context removes the ambiguity instead of adding a retry that would hide
    // a real redirect if one ever appears.
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },   // the size the app is designed for
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: 'fa-IR',
    })
    const page = await context.newPage()
    let entry = { route, label, auth, ok: false }
    try {
      if (auth && TOKEN) {
        // Seed the session on the app origin before the route renders, or
        // RequireAuth bounces to /login before the token is ever read.
        await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30_000 })
        await page.evaluate((t) => localStorage.setItem('pawsmarket-auth-token', t), TOKEN)
      }

      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      await settle(page)

      // A guarded route without a token lands on /login — record that rather
      // than pretending the numbers belong to the route that was asked for.
      const landed = new URL(page.url()).pathname
      const want = route.split('?')[0]
      if (landed !== want) {
        entry = {
          route, label, auth, ok: false,
          error: `redirected to ${landed}${TOKEN ? '' : ' (needs --token)'}`,
        }
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
            // The first selector is enough to find it; full lists bloat the file.
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
    results.push(entry)

    console.log(
      `  ${route.padEnd(24)} crit=${entry.ok ? entry.byImpact.critical : '-'}` +
      ` serious=${entry.ok ? entry.byImpact.serious : '-'}` +
      ` moderate=${entry.ok ? entry.byImpact.moderate : '-'}` +
      ` minor=${entry.ok ? entry.byImpact.minor : '-'}` +
      (entry.ok ? '' : `  ${entry.error}`),
    )
  }

  await browser.close()

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
