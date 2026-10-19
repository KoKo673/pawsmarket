/**
 * Two bugs from the voice notes, measured in a real browser.
 *
 * Both were reported by the user from a phone, and both were small enough
 * that "it looks right in the code" would have been the wrong answer — the
 * first one is about what the field *shows*, the second about whether a
 * phone setting is followed *after* first paint.
 *
 *   ۰۹ — typing Latin digits shows Persian digits, and the form still
 *       accepts the number (the display must not change what is sent).
 *   ۱۱ — a visitor who has never touched the toggle follows the phone:
 *       dark phone → dark site, and switching the phone with the site open
 *       flips it live. An explicit choice, once made, wins and stays put.
 *
 * Run against a built bundle:  node scripts/phone_theme_audit.mjs --base ...
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

const FA = '۰۱۲۳۴۵۶۷۸۹'
const results = []
function record(name, pass, detail) {
  results.push({ name, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

/** The auth card defaults to the phone tab, so the field is there on /login. */
async function gotoPhoneForm(page) {
  await page.goto(BASE + '/login', { waitUntil: 'load' })
  const input = page.locator('#otp-phone')
  await input.waitFor({ state: 'visible', timeout: 15000 })
  return input
}

async function themeOf(page) {
  return page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    light: document.documentElement.classList.contains('light'),
    stored: localStorage.getItem('pawsmarket-theme'),
    scheme: getComputedStyle(document.documentElement).colorScheme,
  }))
}

const browser = await launch()
let exitCode = 0
try {
  // ── ۱۲: the phone field shows Persian digits ────────────────────────
  {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const input = await gotoPhoneForm(page)

    await input.fill('')
    await input.pressSequentially('09378440647', { delay: 12 })
    const shown = await input.inputValue()
    const allPersian = [...shown].every((c) => FA.includes(c))
    record(
      'typing Latin digits shows Persian digits',
      allPersian && shown === '۰۹۳۷۸۴۴۰۶۴۷',
      `field shows "${shown}"`,
    )

    // The caret must not jump to the end when editing in the middle.
    // Put it after the third digit and insert one; the rest must survive.
    await input.evaluate((el) => el.setSelectionRange(3, 3))
    await input.pressSequentially('5', { delay: 12 })
    const edited = await input.inputValue()
    record(
      'editing in the middle keeps the caret in place',
      edited === '۰۹۳۵۷۸۴۴۰۶۴۷',
      `after inserting at index 3: "${edited}"`,
    )

    // The display change must not break validation — the button is gated
    // on phoneOk, so if normalisePhone stopped reading Persian this would
    // be disabled and the form would look fine but be unusable.
    await input.fill('')
    await input.pressSequentially('09123456789', { delay: 12 })
    const submit = page.getByRole('button', { name: /دریافت کد/ })
    const enabled = await submit.isEnabled()
    record(
      'a Persian-formatted number still passes validation',
      enabled,
      `submit button enabled=${enabled}, field "${await input.inputValue()}"`,
    )
    await ctx.close()
  }

  // ── ۱۱: the theme follows the phone ────────────────────────────────
  {
    // A phone that is dark, and a visitor who has never chosen.
    const ctx = await browser.newContext({ colorScheme: 'dark' })
    const page = await ctx.newPage()
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await page.waitForTimeout(600)

    const first = await themeOf(page)
    record(
      'a dark phone gets the dark theme on the first visit',
      first.dark && !first.light,
      `html classes dark=${first.dark} light=${first.light}, color-scheme=${first.scheme}`,
    )
    record(
      'merely visiting does not record a choice',
      first.stored === null,
      `localStorage pawsmarket-theme = ${JSON.stringify(first.stored)}`,
    )

    // Switching the phone while the site is open must flip it, live.
    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForTimeout(400)
    const live = await themeOf(page)
    record(
      'switching the phone to light flips the open page',
      live.light && !live.dark,
      `after emulateMedia(light): dark=${live.dark} light=${live.light}`,
    )

    // Reload: still following, and still no stored choice.
    await page.reload({ waitUntil: 'load' })
    await page.waitForTimeout(600)
    const afterReload = await themeOf(page)
    record(
      'the followed theme survives a reload without being pinned',
      afterReload.light && afterReload.stored === null,
      `dark=${afterReload.dark} light=${afterReload.light} stored=${JSON.stringify(afterReload.stored)}`,
    )

    // An explicit choice wins over the phone, and stays through a reload.
    const toggle = page.getByRole('button', { name: /تغییر به حالت/ })
    if (await toggle.count()) {
      await toggle.first().click()
      await page.waitForTimeout(400)
      const chosen = await themeOf(page)
      await page.emulateMedia({ colorScheme: 'light' })
      await page.waitForTimeout(400)
      const held = await themeOf(page)
      await page.reload({ waitUntil: 'load' })
      await page.waitForTimeout(600)
      const persisted = await themeOf(page)
      record(
        'an explicit choice overrides the phone and persists',
        chosen.dark && held.dark && persisted.dark && persisted.stored === 'dark',
        `chosen dark=${chosen.dark} stored=${chosen.stored}; after phone→light dark=${held.dark}; after reload dark=${persisted.dark}`,
      )
    } else {
      record('an explicit choice overrides the phone and persists', false,
        'the theme toggle button was not found')
    }
    await ctx.close()
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
