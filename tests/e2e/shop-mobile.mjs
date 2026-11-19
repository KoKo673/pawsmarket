/**
 * فروشگاه روی گوشی — آنچه صاحب پروژه از موبایل گزارش کرد.
 *
 * Why this file exists separately from journey-strict.mjs: that one walks
 * the purchase flow at the default (desktop) viewport. Every defect in
 * here was reported from a 375px phone and would have passed a desktop
 * run untouched. The pager scroll is the case in point: it was "fixed"
 * once, verified at 1440px where `scrollY` came back 192, and shipped —
 * and on a phone the same code left the grid far below the fold, so the
 * owner filed the identical bug a second time.
 *
 * So every check names the viewport it needs, and asserts what the reader
 * can SEE rather than which API was called. `scrollIntoView` firing is not
 * the requirement; «the first product is on screen» is.
 *
 * Run:
 *   node tests/e2e/shop-mobile.mjs
 *   BASE=http://localhost:9233 node tests/e2e/shop-mobile.mjs
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE || 'https://pawsmarket.ir'

// The device the reports came from. Not emulated by UA here — these are
// layout bugs, so the viewport size is the variable that matters.
const PHONE = { width: 375, height: 812 }
const TABLET = { width: 768, height: 1024 }
const DESKTOP = { width: 1440, height: 900 }

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`)
}

// Which browser, and why it is an env var rather than a constant:
//   · on this laptop the downloaded chromium-headless-shell is absent and
//     Docker Hub was unreachable, so system Chrome (`channel: 'chrome'`) is
//     what exists;
//   · inside mcr.microsoft.com/playwright the bundled chromium is the only
//     one, and there is no system Chrome to point at.
// Choosing wrongly here costs a confusing launch error, so the caller says.
const CHANNEL = process.env.PW_CHANNEL || undefined
const browser = await chromium.launch(CHANNEL ? { channel: CHANNEL } : {})

/** Where the reader ends up after tapping a pager button: the y of the
 *  FIRST PRODUCT CARD relative to the viewport, and window.scrollY.
 *
 *  `page` is passed in, not created: «صفحهٔ قبل» only exists once you are
 *  on page 2, so the two taps must happen in ONE page object. A fresh page
 *  starts at page 1 with prev disabled, and Playwright then waits 30s for a
 *  click that can never land — which is what happened on the first run of
 *  this file, before it had measured anything. */
async function measureAfterTap(page, label) {
  await page.bringToFront()
  // Go to the pager the way a reader does: finish the page, then tap.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(400)

  const btn = page.getByRole('button', { name: label }).first()
  if (!(await btn.count())) return { missing: true, why: 'no button' }
  const enabled = await btn.isEnabled()
  if (!enabled) return { missing: true, why: 'button disabled at tap time' }

  // Did the tap reach the handler at all? `addEventListener` on window with
  // capture:true sees the event before React's delegation, so this is a real
  // answer and not an inference from "the page looks unchanged".
  await page.evaluate(() => {
    window.__taps = 0
    window.addEventListener('click', () => { window.__taps++ }, true)
  })
  const firstName = await page.locator('ul.grid li').first().innerText()
  const yBefore = await page.evaluate(() => Math.round(window.scrollY))

  const apiReqs = []
  page.on('request', (r) => r.url().includes('/api/shop/products') && apiReqs.push(r.url()))

  const t0 = Date.now()
  await btn.click({ timeout: 8000 }).catch((e) => { apiReqs.push('CLICK-ERR:' + e.message.slice(0, 60)) })
  const clickMs = Date.now() - t0

  // The new page loads while the old grid stays mounted (placeholderData),
  // so wait for the request to settle, not for a DOM mutation.
  await page.waitForTimeout(1800)

  const scrollY = await page.evaluate(() => Math.round(window.scrollY))
  const taps = await page.evaluate(() => window.__taps)
  // A PRODUCT CARD, not the count line: «بالا» to the owner means the goods
  // are in front of them. Measuring the <p> above the grid is what let the
  // previous fix pass at scrollY=192 and still look broken on a phone.
  const first = await page.locator('ul.grid li').first().boundingBox()
  const newName = await page.locator('ul.grid li').first().innerText()
  const vh = await page.evaluate(() => window.innerHeight)
  return { scrollY, yBefore, cardY: first ? Math.round(first.y) : null, vh,
           taps, clickMs, apiReqs, changed: newName.slice(0, 24) !== firstName.slice(0, 24), newName: newName.slice(0, 24) }
}

for (const [name, vp] of [['phone', PHONE], ['tablet', TABLET], ['desktop', DESKTOP]]) {
  const ctx = await browser.newContext({ viewport: vp })
  console.log(`\n── ${name} ${vp.width}×${vp.height} ${'─'.repeat(Math.max(0, 30 - name.length))}`)

  const page = await ctx.newPage()
  // 'load', not 'networkidle': production pings analytics continuously, so
  // networkidle never settles and the test times out on a healthy site. The
  // products are what we wait for, and waitForSelector says that directly.
  await page.goto(`${BASE}/shop`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('ul.grid li', { timeout: 20_000 })

  // Assert against the FOLD, not against zero. Scrolling to 0 can still
  // leave the answer off-screen when the header is tall, and scrolling to
  // an element can look right at a width where that element sits near the
  // top — which is exactly how the previous fix passed at 1440px with
  // scrollY=192 and failed on a phone.
  const report = (which, r) => {
    if (r.missing) return check(`${name}: after ${which} the first product is visible`, false, r.why)
    // Three separate questions, because the owner's report ("it stays down
    // there") could mean any of them and conflating them hides the cause:
    //   1. did the tap reach the page?      → taps
    //   2. did a new page actually load?    → apiReqs + changed
    //   3. did the viewport go to the goods? → cardY
    check(`${name}: ${which} tap reaches the page`, r.taps > 0, `taps=${r.taps} clickMs=${r.clickMs}`)
    check(`${name}: ${which} loads a different set of products`, r.changed,
          `api=${r.apiReqs.length} firstCardNow=${JSON.stringify(r.newName)}`)
    // What the owner means by «بالا»: back at the TOP of the page, with the
    // header and search above the cards. Asserting only "some card is on
    // screen" is what let the earlier fix pass — scrollY 292 puts the count
    // line at y≈96 and hides «محصولات حیوان خانگی» and the search box, which
    // reads as "still down at the pager".
    //
    // Tolerance: the fixed navbar holds the top ~65px, so an honest return to
    // the top lands in 0..130. Anything past that is "still down there".
    const atTop = r.scrollY <= 130
    check(`${name}: after ${which} the reader is back at the top of the page`, atTop,
          `scrollY=${r.scrollY} (started ${r.yBefore}) cardY=${r.cardY} viewportH=${r.vh}`)
  }
  report('«صفحهٔ بعد»', await measureAfterTap(page, 'صفحهٔ بعد'))
  report('«صفحهٔ قبل»', await measureAfterTap(page, 'صفحهٔ قبل'))

  // ── card uniformity ────────────────────────────────────────────────
  // A starred card is taller by one line, and in a CSS grid every cell in
  // a row stretches to the tallest, so the button floats to a different y
  // in each card of the same row. The reader notices it as two cards whose
  // «خرید» buttons do not line up. Measured across the whole first screen
  // of cards, not one pair.
  // 'load', not 'networkidle': production pings analytics continuously, so
  // networkidle never settles and the test times out on a healthy site. The
  // products are what we wait for, and waitForSelector says that directly.
  await page.goto(`${BASE}/shop`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('ul.grid li', { timeout: 20_000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)

  const geom = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('ul.grid li')]
    return cards.slice(0, 12).map((c) => {
      const btn = c.querySelector('button, a[href="/login?next=/shop"]')
      const price = [...c.querySelectorAll('p')].find((p) => /تومان/.test(p.textContent || ''))
      // Detection must match what RatingStars actually renders; if it finds
      // nothing, the height check below passes vacuously on every card and
      // reports a clean run for a bug that is still there.
      const stars = c.querySelector('[data-testid="rating-stars"]')
      const r = btn?.getBoundingClientRect()
      return {
        h: Math.round(c.getBoundingClientRect().height),
        top: Math.round(c.getBoundingClientRect().top),
        btnBottom: r ? Math.round(r.bottom) : null,
        priceTop: price ? Math.round(price.getBoundingClientRect().top) : null,
        starred: !!stars,
      }
    })
  })

  const withBtn = geom.filter((g) => g.btnBottom !== null)

  // Rows are found by GEOMETRY, not by guessing the column count: cards in
  // the same visual row share a top edge. Grouping by btnBottom instead — as
  // an earlier version of this check did — compares cards that were already
  // aligned and passes whatever the layout does.
  const byTop = new Map()
  for (const g of geom) {
    const key = Math.round(g.top / 4) * 4
    if (!byTop.has(key)) byTop.set(key, [])
    byTop.get(key).push(g)
  }
  const rows = [...byTop.values()].filter((r) => r.length > 1)

  // The property the reader experiences as «تراز»: every card in a row puts
  // its button on the same line. Not conditioned on stars — a two-line name
  // breaks alignment just as surely as a rating does, and the owner's
  // screenshot showed exactly that after the star slot was reserved.
  const ragged = rows.filter((r) => new Set(r.map((x) => x.btnBottom)).size > 1)
  check(`${name}: every card in a row ends at the same button line`,
        ragged.length === 0,
        `rows=${rows.length} ragged=${ragged.length}` +
        (ragged[0] ? ` e.g. ${JSON.stringify(ragged[0].map((x) => ({ h: x.h, starred: x.starred, btn: x.btnBottom })))}` : ''))

  const mixedRows = rows.filter((r) => r.some((x) => x.starred) && r.some((x) => !x.starred))
  check(`${name}: at least one row mixes starred and unstarred cards (the check is exercised)`,
        mixedRows.length > 0, `mixedRows=${mixedRows.length}`)

  const starred = withBtn.filter((g) => g.starred)
  const plain = withBtn.filter((g) => !g.starred)
  if (starred.length && plain.length) {
    const sH = [...new Set(starred.map((g) => g.h))]
    const pH = [...new Set(plain.map((g) => g.h))]
    check(`${name}: card heights do not depend on whether a rating exists`,
          sH.length === 1 && pH.length === 1 && sH[0] === pH[0],
          `starred heights=${JSON.stringify(sH)} plain heights=${JSON.stringify(pH)}`)
  } else {
    check(`${name}: card heights do not depend on whether a rating exists`, true,
          `only one kind present (starred=${starred.length} plain=${plain.length}) — not conclusive here`)
  }

  await page.close()
  await ctx.close()
}

// ── copy: we are the only store ──────────────────────────────────────
console.log('\n── copy ─────────────────────────────────────────')
{
  const ctx = await browser.newContext({ viewport: PHONE })
  const page = await ctx.newPage()
  const seen = []
  // /explore is included on purpose: its sidebar says «خدمات و فروشگاه‌ها»,
  // which is about service centres and is TRUE. A check that fails there is
  // over-broad, and an over-broad check gets ignored — so the gate must be
  // able to tell a real violation from a legitimate plural.
  for (const path of ['/', '/shop', '/explore']) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    const text = await page.evaluate(() => document.body.innerText)
    seen.push({ path, text })
  }
  // What is being forbidden, precisely — because a first attempt matched the
  // bare word «فروشگاه‌ها» and failed on /explore, whose "خدمات و فروشگاه‌ها"
  // filter is about SERVICE CENTRES and is true. The owner's complaint is
  // narrower and sharper: we are the only seller, so nothing may
  //   (a) put a COUNT in front of فروشگاه/بازار — that counts other shops,
  //   (b) invite the reader to FIND/discover stores — there are none to find,
  //   (c) mark goods as "our own stock" — with one seller that needs no label.
  // Referencing our own store in the singular, and counting مراکز خدمات
  // (clinics/groomers, which really are many), are both allowed.
  const bad = [
    [/([۰-۹0-9][۰-۹0-9٬,\s]*)\s*(فروشگاه|بازار)\b/, 'a number counting stores'],
    [/(پیدا\s+کنید|جستجو\s+کنید)[^.!\n]{0,40}(فروشگاه|بازار)/, 'an invitation to find stores'],
    [/(فروشگاه|بازار)[^.!\n]{0,20}(پیدا\s+کنید|جستجو\s+کنید)/, 'an invitation to find stores'],
    [/موجودی\s+خود/, "a redundant 'our own stock' badge"],
  ]
  for (const { path, text } of seen) {
    const hits = bad.filter(([re]) => re.test(text)).map(([, why]) => why)
    check(`${path}: no claim of other stores`, hits.length === 0, hits.join(', '))
  }
  await ctx.close()
}

await browser.close()

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) {
  console.log('FAILED:')
  for (const f of failed) console.log('  · ' + f.name + (f.detail ? ' — ' + f.detail : ''))
  process.exit(1)
}
