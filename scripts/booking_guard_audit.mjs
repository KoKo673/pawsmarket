/**
 * /booking/:storeId must refuse a shop in the page, not at the server.
 *
 * The detail sheet already hides the button for a non-serviceable store,
 * but the URL is plain and shareable. Before this guard, opening it for a
 * shop showed the full booking form and only the last request failed.
 *
 * Verified against the catalog's own ids so this cannot drift into testing
 * a category nothing has: 68 is a real `shop`, 478 a real `vet`.
 */
import { chromium } from 'playwright'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg('base', 'http://127.0.0.1:4173')

async function launch() {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true })
  } catch {
    return await chromium.launch({ headless: true })
  }
}

const results = []
function record(name, pass, detail) {
  results.push({ name, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await launch()
let exitCode = 0
try {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  // ── A shop is refused ─────────────────────────────────────────────
  await page.goto(BASE + '/booking/68', { waitUntil: 'load' })
  // The store resolves from an async query, so wait for the decision
  // rather than reading the first paint and calling it the answer.
  await page.waitForTimeout(3000)
  const shopH1 = (await page.locator('h1').allTextContents()).join(' ')
  const shopInputs = await page.locator('form input').count()
  record(
    'a shop id gets the refusal, not the form',
    shopH1.includes('نوبت نمی‌گیرد') && shopInputs === 0,
    `h1="${shopH1}" form inputs=${shopInputs}`,
  )

  // ── A clinic still gets the form ──────────────────────────────────
  // The h1 is the store's own name; «درخواست نوبت» is the badge above it.
  // Asserting the badge against the h1 was this test's first bug, not the
  // product's — the form did render, under its own name.
  await page.goto(BASE + '/booking/478', { waitUntil: 'load' })
  await page.waitForTimeout(3000)
  const vetH1 = (await page.locator('h1').allTextContents()).join(' ')
  const badge = (await page.locator('body').innerText()).includes('درخواست نوبت')
  const hasForm = await page.locator('form').count()
  record(
    'a clinic id still reaches the booking form',
    badge && hasForm > 0 && !vetH1.includes('نوبت نمی‌گیرد'),
    `h1="${vetH1}" badge=${badge} forms=${hasForm}`,
  )

  const failed = results.filter((r) => !r.pass)
  console.log('')
  console.log(failed.length ? `${failed.length} of ${results.length} failed`
    : `all ${results.length} passed`)
  if (failed.length) exitCode = 1
} finally {
  await browser.close()
}

process.exit(exitCode)
