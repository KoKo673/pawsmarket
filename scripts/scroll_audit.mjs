/**
 * Does the home page stay where it put itself?
 *
 * This exists because a scroll bug was reported twice, guessed at twice, and
 * both guesses failed — the second one made it visibly worse. The rule from
 * that: a bug that survives a fix needs a test that fails without the fix.
 *
 * What actually went wrong, once a stack trace was captured in the page:
 * ProductRail has an effect that scrolls the first NEWLY added card into view,
 * so that pressing «بیشتر» reads as "here is the next row". Its guard
 * compared shown.length against the count rendered last time — but the first
 * render has no data, so the effect wrote 0, and the render after the query
 * resolved then looked like an increase from 0 to 8. It scrolled children[0],
 * the FIRST card, as if the button had been pressed.
 *
 * Measured on the live site: that card sits at document top 2889 with height
 * 333, and centring it computes 2889 - (808-333)/2 = 2652 — exactly where a
 * cold load came to rest, with the hero h1 at top -1965.
 *
 * Three assertions, each of which fails against that version:
 *
 *   1. A cold load of "/" ends at scrollY 0, with the h1 on screen.
 *   2. Reloading from deep in the page returns to 0.
 *   3. Pressing «بیشتر» DOES scroll — the rail keeps the behaviour it was
 *      written for. Without this, deleting the effect would pass the suite.
 *
 * The third one matters more than it looks: a fix that simply removed the
 * effect would satisfy 1 and 2 and quietly break the button. It is the
 * assertion that keeps the fix honest.
 *
 *   node scripts/scroll_audit.mjs [--base http://127.0.0.1:4173]
 *
 * Exit 0 when all three hold, 1 otherwise.
 */
import { chromium } from 'playwright'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg('base', 'http://127.0.0.1:4173')

/** Prefer installed Chrome; CI falls back to the bundled browser. See
 * contrast_audit.mjs for why the bundled one cannot be fetched in Iran. */
async function launch() {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true })
  } catch {
    return await chromium.launch({ headless: true })
  }
}

/** Let the page finish growing: the rail mounts after the query resolves, and
 *  a scroll that settles before that would hide the very movement we look for. */
async function settle(page, ms = 2500) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
}

/**
 * Read the scroll position from the DOM, twice, and require agreement.
 *
 * `window.scrollY` is the obvious call and it lied to me while this bug was
 * being found: on a page that scrolls during parsing, a read taken through the
 * automation bridge came back with the value from *before* the scroll — 2652
 * reported on a page whose documentElement.scrollTop was 0. That is not a
 * property of the page (in a normal browser the two agree), but a test that
 * trusts one reading is a test that can pass for the wrong reason.
 *
 * So: read `document.scrollingElement.scrollTop` (the real layout value rather
 * than the window accessor), take it twice a frame apart, and treat a
 * disagreement as a failure rather than choosing one.
 */
async function readScroll(page) {
  const first = await page.evaluate(() => ({
    top: Math.round(document.scrollingElement.scrollTop),
    win: Math.round(window.scrollY),
  }))
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))))
  const second = await page.evaluate(() => ({
    top: Math.round(document.scrollingElement.scrollTop),
    win: Math.round(window.scrollY),
  }))
  return {
    top: second.top,
    win: second.win,
    stable: first.top === second.top,
    agree: second.top === second.win,
  }
}

const results = []
function record(name, pass, detail) {
  results.push({ name, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

/**
 * Count scrollIntoView calls, by patching the prototype before the app loads.
 *
 * The position alone is not enough to catch this bug. A page can end at the
 * top for the wrong reason — an unrelated scroll, or a browser that clamped
 * it — and the assertion would pass while the defect is still there. What
 * distinguishes the defect is the *call*: the rail asks the browser to centre
 * a card during load, and that call is the bug.
 *
 * `addInitScript` runs before any page script, so the patch is in place
 * before React exists.
 */
async function countScrollIntoView(page) {
  await page.addInitScript(() => {
    window.__siv = 0
    const orig = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (...args) {
      window.__siv = (window.__siv || 0) + 1
      return orig.apply(this, args)
    }
  })
}

const browser = await launch()
const ctx = await browser.newContext()
let exitCode = 0
try {
  const page = await ctx.newPage()
  await countScrollIntoView(page)

  // ── 1. A cold load stays at the top ───────────────────────────────
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await settle(page)
  const cold = await readScroll(page)
  const coldH1 = await page.evaluate(() => {
    const h1 = document.querySelector('h1')
    return h1 ? Math.round(h1.getBoundingClientRect().top) : null
  })
  const coldSiv = await page.evaluate(() => window.__siv || 0)
  record(
    'cold load of / stays at the top',
    cold.stable && cold.top === 0 && coldH1 !== null && coldH1 > 0,
    `scrollingElement.top=${cold.top} h1.top=${coldH1} stable=${cold.stable}`,
  )
  record(
    'cold load asks the browser to scroll nothing into view',
    coldSiv === 0,
    `scrollIntoView was called ${coldSiv} time(s) during load`,
  )

  // ── 2. Reload from deep in the page returns to the top ────────────
  const beforeReload = await page.evaluate(() => {
    window.scrollTo(0, 3000)
    return new Promise((r) => setTimeout(() => r(document.scrollingElement.scrollTop), 120))
  })
  await page.reload({ waitUntil: 'load' })
  await settle(page)
  const after = await readScroll(page)
  const afterH1 = await page.evaluate(() => {
    const h = document.querySelector('h1')
    return h ? Math.round(h.getBoundingClientRect().top) : null
  })
  const afterSiv = await page.evaluate(() => window.__siv || 0)
  record(
    'reload from 3000px returns to the top',
    beforeReload > 2000 && after.stable && after.top === 0 && (afterH1 ?? 1) > 0,
    `was=${Math.round(beforeReload)} now=${after.top} h1.top=${afterH1} stable=${after.stable}`,
  )
  record(
    'reload asks the browser to scroll nothing into view',
    afterSiv === 0,
    `scrollIntoView was called ${afterSiv} time(s) during the reload`,
  )

  // ── 3. «بیشتر» still scrolls on purpose ───────────────────────────
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
  const more = page.getByRole('button', { name: /بیشتر/ })
  if (await more.count()) {
    const yBefore = await readScroll(page)
    const sivBefore = await page.evaluate(() => window.__siv || 0)
    await more.first().click()
    await page.waitForTimeout(1200)
    const yAfter = await readScroll(page)
    const sivAfter = await page.evaluate(() => window.__siv || 0)
    record(
      '«بیشتر» still brings the next card into view',
      yAfter.stable && yAfter.top > yBefore.top && sivAfter > sivBefore,
      `scrollingElement.top ${yBefore.top} → ${yAfter.top}, scrollIntoView calls ${sivBefore} → ${sivAfter}`,
    )
  } else {
    record('«بیشتر» still brings the next card into view', false,
      'the button was not found — the rail may have fewer than 9 items')
  }

  const failed = results.filter((r) => !r.pass)
  console.log('')
  if (failed.length) {
    console.log(`${failed.length} of ${results.length} failed`)
    exitCode = 1
  } else {
    console.log(`all ${results.length} passed`)
  }
} finally {
  await browser.close()
}

process.exit(exitCode)
