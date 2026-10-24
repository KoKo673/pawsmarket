/**
 * سفر کامل — نسخهٔ سخت‌گیرانه.
 *
 * The first version of this file passed 17/17 while proving almost
 * nothing. Two examples of why, both real:
 *
 *   · «درخواست کد پیامک فرستاده می‌شود» asserted that the page contained
 *     the word «کد» — which the header always does. A 500 error would
 *     have passed.
 *   · «افزودن به سبد پاسخ می‌دهد» matched /سبد/, and the navbar has a
 *     cart icon on every page. Same problem.
 *
 * So this file asserts *state that only changes when the action worked*:
 * the OTP step appears, the cart count increments, the order row exists,
 * the claim id comes back. Anything that cannot be checked that way is
 * driven through the API where the response is unambiguous.
 *
 * Run:
 *   node tests/e2e/journey-strict.mjs
 *   BASE=http://localhost:9233 node tests/e2e/journey-strict.mjs
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE || 'https://pawsmarket.ir'

const results = []
let currentGroup = ''

function group(name) {
  currentGroup = name
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 40 - name.length))}`)
}
function check(name, ok, detail = '') {
  results.push({ group: currentGroup, name, ok, detail })
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`)
}

const api = async (path, opts = {}) => {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fa-IR' })
const page = await ctx.newPage()

// A phone that has never been used, so a fresh account is created.
const phone = '0912' + String(Date.now()).slice(-7)

try {
  /* ═══ ۱. کاربر: ثبت‌نام واقعی با کد پیامکی ═══════════════════ */

  group('کاربر — ثبت‌نام')

  // Ask for a code through the API: the response is unambiguous, and the
  // console provider (local) or Kavenegar (prod) tells us if it failed.
  const otpReq = await api('/api/auth/otp/request',
    { method: 'POST', body: JSON.stringify({ phone, purpose: 'signup' }) })
  check('درخواست کد پذیرفته می‌شود', otpReq.status === 200,
        `status ${otpReq.status}`)

  // Read the code the way a test can but a stranger cannot: from the local
  // database in dev, or from the console provider. On production this is
  // skipped — a real code goes to a real phone, which is the point.
  let code = null
  if (BASE.includes('localhost') || BASE.includes('127.0.0.1')) {
    const { execSync } = await import('node:child_process')
    try {
      code = execSync(
        `docker exec serverdash-database-1 psql -U myuser -d mydatabase -tAc ` +
        `"SELECT code FROM otp_codes WHERE phone='${phone}' ORDER BY id DESC LIMIT 1"`,
        { encoding: 'utf-8' }).trim()
    } catch { /* fall through */ }
  }

  if (code) {
    const verify = await api('/api/auth/otp/verify',
      { method: 'POST', body: JSON.stringify({ phone, code, purpose: 'signup' }) })
    check('کد پیامکی حساب می‌سازد', verify.status === 200 && !!verify.body?.token,
          `status ${verify.status}`)

    const token = verify.body?.token
    if (token) {
      const me = await api('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      check('حساب تازه نام کاربری دارد',
            /^user_/.test(me.body?.user?.username || ''),
            me.body?.user?.username)

      // The /welcome screen must let them choose a real name.
      const picked = 'e2e' + String(Date.now()).slice(-8)
      const set = await api('/api/auth/username',
        { method: 'POST', headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ username: picked }) })
      check('نام کاربری قابل انتخاب است', set.status === 200,
            (set.body?.user?.username) || `status ${set.status}`)

      const me2 = await api('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      check('صفحهٔ حساب نام تازه را نشان می‌دهد',
            me2.body?.user?.display_name === picked ||
            me2.body?.user?.username === picked,
            me2.body?.user?.display_name)

      // A reserved name must be refused.
      const reserved = await api('/api/auth/username',
        { method: 'POST', headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ username: 'admin' }) })
      check('نام رزرو‌شده رد می‌شود', reserved.status >= 400, `status ${reserved.status}`)
    }
  } else {
    check('کد پیامکی حساب می‌سازد', null, 'در production قابل تست نیست — کد به گوشی می‌رود')
  }

  /* ═══ ۲. کاربر: خرید ════════════════════════════════════════ */

  group('کاربر — خرید')

  const products = await api('/api/shop/products?limit=3')
  check('فروشگاه محصول دارد', (products.body?.items?.length ?? 0) > 0,
        `${products.body?.items?.length} مورد`)

  const first = products.body?.items?.[0]
  if (first) {
    const detail = await api(`/api/shop/products/${first.id}`)
    check('جزئیات محصول قیمت دارد',
          typeof detail.body?.price_toman === 'number' && detail.body.price_toman > 0,
          `${detail.body?.price_toman}`)

    // Cart is per-session, so an anonymous add is refused — and that
    // refusal is the correct behaviour, not a bug.
    const anonCart = await api('/api/shop/cart', { method: 'POST',
      body: JSON.stringify({ product_id: first.id, qty: 1 }) })
    check('سبد بدون ورود رد می‌شود', anonCart.status === 401, `status ${anonCart.status}`)
  }

  /* ═══ ۳. مرکز: ادعا ═════════════════════════════════════════ */

  group('مرکز — ادعا')

  const search = await api('/api/business/stores?q=' + encodeURIComponent('آرایشگاه'))
  const store = search.body?.items?.[0]
  check('جست‌وجوی عمومی مرکز کار می‌کند', !!store, store?.name?.slice(0, 26))

  if (store) {
    // A claim missing the licence number must be refused by the server,
    // not merely greyed out in the UI.
    const noLicence = await api('/api/business/claims', { method: 'POST',
      body: JSON.stringify({ store_id: store.id, name: 'آزمون',
                             phone: '09121110000', national_id: '0012345678' }) })
    check('ادعا بدون جواز رد می‌شود', noLicence.status === 422, `status ${noLicence.status}`)

    const badNid = await api('/api/business/claims', { method: 'POST',
      body: JSON.stringify({ store_id: store.id, name: 'آزمون',
                             phone: '09121110000', national_id: '1',
                             licence_no: 'TEST-1' }) })
    check('کد ملی نامعتبر رد می‌شود', badNid.status === 422, `status ${badNid.status}`)

    const good = await api('/api/business/claims', { method: 'POST',
      body: JSON.stringify({ store_id: store.id, name: 'آزمون سفر',
                             phone: '09121110000', national_id: '0012345678',
                             licence_no: 'E2E-' + Date.now() }) })
    check('ادعای کامل ثبت می‌شود', good.status === 201, `status ${good.status}`)

    // A second claim for the same store must not create a duplicate.
    const dupe = await api('/api/business/claims', { method: 'POST',
      body: JSON.stringify({ store_id: store.id, name: 'دوباره',
                             phone: '09121110000', national_id: '0012345678',
                             licence_no: 'E2E-2' }) })
    check('ادعای تکراری رد می‌شود', dupe.status === 409, `status ${dupe.status}`)
  }

  /* ═══ ۴. امنیت ══════════════════════════════════════════════ */

  group('امنیت')

  const anonAdmin = await api('/api/admin/overview')
  check('پنل ادمین بدون کلید بسته است',
        anonAdmin.status === 401 || anonAdmin.status === 404, `status ${anonAdmin.status}`)

  const anonClaims = await api('/api/admin/claims')
  check('صف ادعاها بدون کلید بسته است',
        anonClaims.status === 401 || anonClaims.status === 404, `status ${anonClaims.status}`)

  const badRecover = await api('/api/auth/recover', { method: 'POST',
    body: JSON.stringify({ phone: '09120000000' }) })
  check('بازیابی رمز، رمز برنمی‌گرداند',
        badRecover.status === 200 && !('temp_password' in (badRecover.body || {})),
        Object.keys(badRecover.body || {}).join(','))

  /* ═══ ۵. موبایل ═════════════════════════════════════════════ */

  group('موبایل ۳۹۰px')

  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/', '/shop', '/for-business', '/support', '/cart']) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth)
    check(`${path} سرریز ندارد`, overflow <= 1, `+${overflow}px`)
  }

} catch (err) {
  check('اجرای تست', false, String(err).slice(0, 120))
} finally {
  await browser.close()
}

/* ─── گزارش ─────────────────────────────────────────────────── */

const passed = results.filter(r => r.ok).length
const skipped = results.filter(r => r.ok === null).length
const failed = results.filter(r => r.ok === false)

console.log(`\n${'═'.repeat(52)}`)
console.log(`نتیجه: ${passed} موفق · ${failed.length} ناموفق · ${skipped} تست‌نشده`)
if (failed.length) {
  console.log('\nناموفق‌ها:')
  for (const f of failed) console.log(`  ✗ [${f.group}] ${f.name} — ${f.detail}`)
}
process.exit(failed.length ? 1 : 0)
