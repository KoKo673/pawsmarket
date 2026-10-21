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

  /*
   * 1. The route is closed at all.
   *
   * BOOKING_ENABLED is false while the catalog and the API name different
   * businesses with the same id. Gating only the detail sheet left this
   * URL live: a shared or guessed link collected a whole form and posted
   * it, and that post can land on an unrelated clinic. Every id below
   * must get the closed notice — shop, clinic and nonsense alike.
   *
   * 2. No form, ever.
   *
   * The old holes were all «store came back undefined, so the guard fell
   * through». While the door is shut that cannot be observed directly, so
   * this asserts the consequence instead: zero form inputs on any id.
   */
  for (const [label, id] of [
    ['a shop id', '68'],
    ['a clinic id', '478'],
    ['an id that does not exist', '99999'],
  ]) {
    await page.goto(`${BASE}/booking/${id}`, { waitUntil: 'load' })
    // The store resolves from an async query, so wait for the decision
    // rather than reading the first paint and calling it the answer.
    await page.waitForTimeout(3000)
    const h1 = (await page.locator('h1').allTextContents()).join(' ')
    const inputs = await page.locator('form input').count()
    const closed = h1.includes('غیرفعال')
    record(
      `${label} cannot open the booking form`,
      closed && inputs === 0,
      `h1="${h1}" form inputs=${inputs}`,
    )
  }

  /*
   * 3. The button is gone from the detail sheet too.
   *
   * The two surfaces read one flag now (lib/booking-rules). If someone
   * turns BOOKING_ENABLED back on before the ids agree, this passes but
   * the routes reopen — so when that flip happens, the assertions above
   * must be rewritten to test the guard again, not deleted.
   */
  await page.goto(BASE + '/explore', { waitUntil: 'load' })
  await page.waitForTimeout(5000)
  const exploreBody = await page.locator('body').innerText()
  record(
    'the explore page offers no booking entry point',
    !exploreBody.includes('درخواست نوبت'),
    `«درخواست نوبت» occurrences: ${(exploreBody.match(/درخواست نوبت/g) || []).length}`,
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
