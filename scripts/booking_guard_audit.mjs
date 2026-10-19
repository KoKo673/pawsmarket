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

  // ── An id that does not exist is refused, not silently allowed ────
  // This is the hole that made the old guard useless. `store` is
  // undefined here, and the guard was `if (store && ...)` — so the whole
  // condition was false and the full form rendered for id 99999.
  await page.goto(BASE + '/booking/99999', { waitUntil: 'load' })
  await page.waitForTimeout(3000)
  const missingH1 = (await page.locator('h1').allTextContents()).join(' ')
  const missingInputs = await page.locator('form input').count()
  record(
    'an unknown id gets «پیدا نشد», not the form',
    missingH1.includes('پیدا نشد') && missingInputs === 0,
    `h1="${missingH1}" form inputs=${missingInputs}`,
  )

  // ── A clinic is still allowed through the guard ───────────────────
  // NOT asserting that the form renders: booking is switched off while
  // the catalog and the API name different businesses by the same id
  // (BOOKING_ENABLED in DetailModal). What must hold either way is that a
  // clinic is not refused — the refusal screen must name the store, which
  // only happens when the guard let it past.
  await page.goto(BASE + '/booking/478', { waitUntil: 'load' })
  await page.waitForTimeout(3000)
  const vetBody = await page.locator('body').innerText()
  const vetH1 = (await page.locator('h1').allTextContents()).join(' ')
  record(
    'a clinic is not refused',
    !vetBody.includes('نوبت نمی‌گیرد') && !vetBody.includes('پیدا نشد'),
    `h1="${vetH1}"`,
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
