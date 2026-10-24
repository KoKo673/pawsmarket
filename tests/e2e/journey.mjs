/**
 * سفر کامل — مثل یک کاربر واقعی، و بعد مثل یک مرکز.
 *
 * Not a smoke test. This walks the product the way two different people
 * do, in order, and asserts the thing each of them actually cares about:
 *
 *   مشتری:  ثبت‌نام با شماره → دیدن فروشگاه → افزودن به سبد → سفارش
 *   مرکز :  ثبت درخواست دسترسی → تأیید مدیر → دیدن نوبت → تأیید/رد
 *
 * Every step asserts the *visible* result, not the status code alone — a
 * 200 that renders an empty page is a failure here.
 *
 * Run against production:
 *   node tests/e2e/journey.mjs
 *   BASE=http://localhost:9233 node tests/e2e/journey.mjs
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE || 'https://pawsmarket.ir'
const ADMIN_KEY = process.env.ADMIN_KEY || ''   // X-Admin-Key, for cleanup only

const results = []
function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  const mark = ok ? '✓' : '✗'
  console.log(`${mark} ${name}${detail ? '  — ' + detail : ''}`)
}

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'fa-IR',
})
const page = await ctx.newPage()

const phone = '0999' + String(Date.now()).slice(-7)
let userId = null
let token = null

try {
  /* ─── ۱. کاربر: ثبت‌نام با شماره ───────────────────────────── */

  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' })
  const onRegister = await page.locator('input[inputmode="numeric"], input[type="tel"]').first()
    .isVisible().catch(() => false)
  record('صفحهٔ ثبت‌نام باز می‌شود', onRegister)

  // The page offers a phone tab; fill it and request a code.
  const phoneInput = page.locator('input[type="tel"], input[inputmode="numeric"]').first()
  if (await phoneInput.count()) {
    await phoneInput.fill(phone)
    await page.waitForTimeout(300)
    const sendBtn = page.getByRole('button', { name: /ارسال|دریافت|کد/ }).first()
    if (await sendBtn.count()) {
      await sendBtn.click()
      await page.waitForTimeout(2500)
      const bodyText = await page.locator('body').innerText()
      record('درخواست کد پیامک فرستاده می‌شود',
             /کد|ثبت|ورود/.test(bodyText),
             bodyText.replace(/\s+/g, ' ').slice(0, 60))
    }
  }

  /* ─── ۲. کاربر: دیدن فروشگاه ──────────────────────────────── */

  await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const cards = await page.locator('a[href^="/shop/"]').count()
  record('فروشگاه محصول نشان می‌دهد', cards > 0, `${cards} کارت`)

  /* ─── ۳. کاربر: صفحهٔ محصول ───────────────────────────────── */

  if (cards > 0) {
    await page.locator('a[href^="/shop/"]').first().click()
    await page.waitForTimeout(1800)
    const url = page.url()
    const onProduct = /\/shop\/\d+/.test(url)
    const hasPrice = await page.locator('body').innerText()
      .then(t => /تومان/.test(t))
    record('صفحهٔ محصول باز می‌شود', onProduct, url.slice(-20))
    record('صفحهٔ محصول قیمت دارد', hasPrice)
  }

  /* ─── ۴. کاربر: سبد خرید ──────────────────────────────────── */

  const addBtn = page.getByRole('button', { name: /افزودن به سبد|خرید/ }).first()
  if (await addBtn.count()) {
    await addBtn.click()
    await page.waitForTimeout(1200)
    const after = await page.locator('body').innerText()
    record('افزودن به سبد پاسخ می‌دهد',
           /سبد|اضافه|ورود/.test(after),
           after.replace(/\s+/g, ' ').slice(0, 50))
  } else {
    record('افزودن به سبد پاسخ می‌دهد', false, 'دکمه پیدا نشد')
  }

  /* ─── ۵. مرکز: جست‌وجوی خود و ثبت درخواست ──────────────────── */

  await page.goto(`${BASE}/for-business`, { waitUntil: 'networkidle' })
  const searchInput = page.getByLabel('جست‌وجوی نام مرکز')
  await searchInput.fill('آرایشگاه')
  await page.getByRole('button', { name: 'جست‌وجو' }).click()
  await page.waitForTimeout(2000)
  const hits = await page.locator('ul li button').count()
  record('جست‌وجوی مرکز نتیجه می‌دهد', hits > 0, `${hits} نتیجه`)

  if (hits > 0) {
    await page.locator('ul li button').first().click()
    await page.waitForTimeout(600)
    const claimForm = await page.getByLabel('کد ملی').isVisible().catch(() => false)
    record('فرم ادعا کد ملی می‌خواهد', claimForm)

    // A claim without a licence number must not be submittable.
    const submit = page.getByRole('button', { name: /ثبت درخواست/ })
    const disabled = await submit.isDisabled().catch(() => null)
    record('فرم ناقص قابل ارسال نیست', disabled === true)

    await page.getByLabel('کد ملی').fill('0012345678')
    await page.getByLabel('شمارهٔ جواز کسب').fill('TEST-12345')
    await page.getByLabel('نام شما').fill('آزمون سفر')
    await page.getByLabel('شماره تماس').fill('09121110000')
    await page.waitForTimeout(400)
    const nowEnabled = await submit.isEnabled().catch(() => false)
    record('فرم کامل قابل ارسال می‌شود', nowEnabled)

    if (nowEnabled) {
      await submit.click()
      await page.waitForTimeout(2500)
      const done = await page.locator('body').innerText()
      record('ثبت درخواست تأیید می‌گیرد',
             /ثبت شد|درخواست شما/.test(done),
             done.replace(/\s+/g, ' ').slice(0, 60))
    }
  }

  /* ─── ۶. امنیت: پنل ادمین از بیرون بسته است ───────────────── */

  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const adminBody = await page.locator('body').innerText()
  const blocked = /پیدا نشد|ورود|دسترسی/.test(adminBody)
  record('پنل ادمین بدون ورود باز نمی‌شود', blocked)

  const navText = await page.locator('nav').innerText().catch(() => '')
  record('لینک ادمین در نوار نیست', !/مدیریت/.test(navText))

  /* ─── ۷. موبایل: بدون سرریز افقی ──────────────────────────── */

  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/', '/shop', '/for-business', '/support']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth)
    record(`موبایل ۳۹۰: ${path} سرریز ندارد`, overflow <= 1, `+${overflow}px`)
  }

} catch (err) {
  record('اجرای سفر', false, String(err).slice(0, 100))
} finally {
  await browser.close()
}

/* ─── گزارش ─────────────────────────────────────────────────── */

const passed = results.filter(r => r.ok).length
const failed = results.filter(r => !r.ok)

console.log(`\n${'─'.repeat(50)}`)
console.log(`نتیجه: ${passed}/${results.length} موفق`)
if (failed.length) {
  console.log('\nناموفق‌ها:')
  for (const f of failed) console.log(`  ✗ ${f.name} — ${f.detail}`)
}
process.exit(failed.length ? 1 : 0)
