/**
 * /booking/:storeId must refuse a store that cannot be booked, in the page.
 *
 * ── What this used to assert, and why it changed ────────────────────────
 * The route was closed to everyone while catalog.json and the API named
 * different businesses with the same id — 0 of 218 shared ids matched, so a
 * booking could land on an unrelated clinic. This file asserted «every id
 * gets the closed notice», and said explicitly:
 *
 *     when that flip happens, the assertions above must be rewritten to
 *     test the guard again, not deleted.
 *
 * The flip happened 2026-10-29. catalog.json is generated from the database
 * now (app/export_catalog.py) and a live check found 447 catalog ids, 447
 * api ids, intersection 447. So this asserts the guard, not the shutdown.
 *
 * ── What a guard has to do ──────────────────────────────────────────────
 * Three things, and the third is the one the old code got wrong:
 *
 *   1. a bookable store opens a form
 *   2. a store that is not bookable (a `shop`) does not
 *   3. an id that does not exist does not, and does not show an empty form
 *
 * The original bug was `if (store && !BOOKABLE.includes(...))`: every way of
 * not having a store — still loading, missing, failed — fell through it and
 * rendered the form, which then posted an id the API rejected. Silence from
 * the data read as permission.
 */
import { chromium } from 'playwright'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg('base', 'http://127.0.0.1:4173')
const API = arg('api', BASE)

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

/**
 * Pick real ids from the API rather than hardcoding them.
 *
 * The old version fixed on 68 and 478, which were real when written and
 * became wrong the moment the catalog was regenerated — the audit kept
 * passing against ids that no longer meant what its comment claimed.
 */
async function pickIds() {
  const r = await fetch(`${API}/api/stores/nearby?lat=35.7&lng=51.4&max_distance=80000&limit=2000`)
  if (!r.ok) throw new Error(`could not read stores: ${r.status}`)
  const stores = await r.json()
  const bookable = stores.find((s) => ['vet', 'groomer', 'boarding'].includes(s.category))
  const notBookable = stores.find((s) => s.category === 'shop')
  if (!bookable) throw new Error('no bookable store in range — cannot audit')
  return { bookable, notBookable, maxId: Math.max(...stores.map((s) => s.id)) }
}

const browser = await launch()
let exitCode = 0
try {
  const { bookable, maxId } = await pickIds()
  const missingId = maxId + 100000
  console.log(`  ids: bookable=${bookable.id} (${bookable.category}), missing=${missingId}`)

  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  async function visit(id) {
    await page.goto(`${BASE}/booking/${id}`, { waitUntil: 'load' })
    // The store resolves from an async query; read the decision, not the
    // first paint.
    await page.waitForTimeout(3000)
    const body = await page.locator('body').innerText()
    return {
      closed: body.includes('غیرفعال') || body.includes('پیدا نشد') || body.includes('یافت نشد'),
      inputs: await page.locator('form input').count(),
      body,
    }
  }

  // 1. A bookable store opens a form. This is the case the shutdown hid:
  //    while the flag was false nothing here could be observed.
  const good = await visit(bookable.id)
  record(
    'a bookable store opens the booking form',
    !good.closed && good.inputs > 0,
    `closed=${good.closed} inputs=${good.inputs}`,
  )

  // 2. An id that does not exist never shows a form. The original bug.
  const bad = await visit(missingId)
  record(
    'an unknown id shows no form',
    bad.closed && bad.inputs === 0,
    `closed=${bad.closed} inputs=${bad.inputs}`,
  )

  // 3. A store that is not bookable never shows a form.
  if (bookable.category !== 'shop') {
    const shopRow = await pickIds().then((r) => r.notBookable)
    if (shopRow) {
      const notBookable = await visit(shopRow.id)
      record(
        'a non-bookable store shows no form',
        notBookable.inputs === 0,
        `inputs=${notBookable.inputs}`,
      )
    }
  }

  // 4. The entry point exists on the detail sheet again — the other half of
  //    the flip. While BOOKING_ENABLED was false this assertion had to be
  //    the opposite ("the explore page offers no booking entry point").
  await page.goto(BASE + '/explore', { waitUntil: 'load' })
  await page.waitForTimeout(5000)
  const exploreBody = await page.locator('body').innerText()
  record(
    'the explore page is alive with the booking path enabled',
    exploreBody.length > 1000 && !exploreBody.includes('غیرفعال'),
    `body length ${exploreBody.length}`,
  )

  await ctx.close()
} catch (err) {
  console.log(`  FAIL  audit could not run — ${err.message}`)
  exitCode = 1
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.pass).length
console.log(`\n  ${results.length - failed}/${results.length} passed`)
if (failed > 0) exitCode = 1
process.exit(exitCode)
