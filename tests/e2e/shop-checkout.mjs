/**
 * مسیر خرید در فرانت — از فروشگاه تا درگاه (ویدئو مورد #4).
 *
 * ── چرا این فایل لازم بود ────────────────────────────────────────────
 * بک‌اند مسیر پرداخت ۱۲ تست داشت. ولی هیچ چیز **در فرانت** تست نبود: اینکه
 * فروشگاه واقعاً کارت نشان دهد، اینکه «افزودن به سبد» در صفحهٔ سبد دیده
 * شود، و اینکه رفتن به پرداخت با خطا یا صفحهٔ سفید نکشد.
 *
 * ── چند فرضی که هنگام نوشتن رد شدند ─────────────────────────────────
 * این را با خواندن کد فهمیدم، نه با حدس زدن، و تست روی واقعیت نوشته شد:
 *
 *   · **شمارندهٔ سبد در نوار بالا وجود ندارد.** Navbar.tsx فقط یک آیکون
 *     `<Link to="/cart">` دارد. اولین نسخهٔ این تست یک `[data-testid=
 *     "cart-count"]` را می‌سنجید که هرگز وجود نداشت و «0 → 0» را سبز
 *     گزارش می‌کرد.
 *   · بنابراین معیارِ «افزودن کار کرد» خودِ صفحهٔ `/cart` است: اگر ردیف
 *     محصول با نامش آنجا باشد، عمل واقعاً انجام شده.
 *
 * ── چه چیزی این تست عمداً انجام نمی‌دهد ─────────────────────────────
 * پرداخت واقعی. تا لحظهٔ درگاه می‌رود و می‌ایستد. اثبات کاملِ تسویه در
 * بک‌اند با stub gateway است، نه اینجا.
 *
 * Run:
 *   node tests/e2e/shop-checkout.mjs
 *   BASE=http://localhost:9000 node tests/e2e/shop-checkout.mjs
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE || 'https://pawsmarket.ir'
const results = []
let group = ''

function g(name) {
  group = name
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 38 - name.length))}`)
}
function check(name, ok, detail = '') {
  results.push({ group, name, ok, detail })
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`)
}

// The username carries the same `t` marker the back-end suite uses, so an
// account leaked by this run is identifiable and removable by the same
// predicate (pawsmarket-serverdash/tests/_fixtures_users.py).
const MARK = 't'

async function newSession() {
  const username = `${MARK}e2e${Math.random().toString(16).slice(2, 12)}`
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password: 'E2e-pass-2026!' }),
  })
  if (!res.ok) throw new Error(`register failed: ${res.status} ${await res.text()}`)
  const body = await res.json()
  return { token: body.token, username }
}

async function firstProduct() {
  const r = await fetch(`${BASE}/api/shop/products?limit=1`)
  if (!r.ok) throw new Error(`catalogue failed: ${r.status}`)
  const { items, total } = await r.json()
  if (!items?.length) throw new Error(`catalogue is empty (total=${total})`)
  return items[0]
}

const main = async () => {
  const product = await firstProduct()
  const session = await newSession()
  console.log(`  product: ${product.name} (${product.price_toman})`)
  console.log(`  user:    ${session.username}`)

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'fa-IR',
  })
  // Sign in via storage so the flow under test is checkout, not login
  // (journey.mjs covers the login form).
  //
  // The key is `pawsmarket-auth-token`, NOT a zustand persist blob —
  // measured: auth.store.ts stores the bare token under that name, and the
  // first version of this test wrote `pawsmarket.auth` as JSON, so the app
  // never saw a session and /cart correctly said «برای دیدن سبد خرید وارد
  // شوید». The test reported that as a fault in the cart page.
  await ctx.addInitScript((tok) => {
    try { localStorage.setItem('pawsmarket-auth-token', tok) } catch { }
  }, session.token)
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  try {
    // ── 1. The shop page renders cards from the database ─────────────
    g('فروشگاه')
    await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle' })
    const cards = await page.locator('a[href*="/shop/"]').count()
    check('cards render on /shop', cards > 0, `${cards} card(s)`)
    const shopText = await page.locator('body').innerText()
    check('/shop did not show an error state', !shopText.includes('خطای غیرمنتظره'))

    // ── 2. Adding to cart: asserted on /cart, not on a badge ────────
    //
    // The URL uses the numeric ID, and every link in the app builds it that
    // way (`/shop/${product.id}` in ProductRail, DetailModal, ProductPage).
    // The first version of this test used the slug and got «این محصول پیدا
    // نشد» — measured: `GET /api/shop/products/digikala-…` is a 422 because
    // the route is `product_id: int`, while `/api/shop/products/2270` is a
    // 200. The app was right and the test was wrong.
    g('افزودن به سبد')
    await page.goto(`${BASE}/shop/${product.id}`, { waitUntil: 'networkidle' })
    const addBtn = page.getByRole('button', { name: /افزودن به سبد/ })
    const hasAdd = (await addBtn.count()) > 0
    check('product page has an add-to-cart button', hasAdd,
      `url /shop/${product.id}`)
    if (hasAdd) {
      await addBtn.first().click()
      await page.waitForTimeout(1500)
    }

    // ── 3. The cart page shows the line and a real total ────────────
    g('سبد')
    await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
    const cartText = await page.locator('body').innerText()
    check('cart is NOT empty after adding', !cartText.includes('سبد خرید خالی است'))
    // The product NAME is the decisive signal: it is only on the page if
    // the row exists. A price string could match a formatted number in
    // unrelated copy; a 40-character product name cannot.
    check('cart shows the product by name',
      cartText.includes(product.name.slice(0, 24)),
      product.name.slice(0, 40))
    check('/cart did not crash', !cartText.includes('خطای غیرمنتظره'))

    // ── 4. Checkout reaches a gateway rather than failing ──────────
    g('پرداخت')
    // The submit button exists but is `disabled` until the form is valid —
    // `disabled={invalid || checkout.isPending}` in CartPage.tsx. The first
    // version asserted only its presence and then tried the API without a
    // gateway, and the 422 «gateway الزامی است» was my request being
    // incomplete, not the endpoint being broken.
    const submit = page.getByRole('button', { name: /پرداخت و ثبت سفارش/ })
    check('cart has a checkout button', (await submit.count()) > 0)
    check('checkout button is disabled until the form is filled',
      await submit.first().isDisabled().catch(() => null) === true)

    // Fill it, and the button must become usable. That is the state change
    // a broken form would fail to make.
    await page.fill('#c-name', 'آزمون آزمون')
    await page.fill('#c-phone', '09120000000')
    await page.fill('#c-addr', 'تهران، خیابان آزمون، پلاک ۱')
    await page.waitForTimeout(400)
    check('checkout button enables once the form is complete',
      await submit.first().isEnabled().catch(() => false))

    // `gateway` is a required field of POST /api/shop/checkout, and there is
    // no /api/shop/gateways endpoint (measured: 404) — the choice is made in
    // the form, where CartPage.tsx fixes it to 'zibal' | 'zarinpal'. The
    // radio the page selected is the honest source, not a constant here.
    const picked = await page.locator('input[name=gateway]:checked').getAttribute('value')
      .catch(() => null)
    const gateway = picked || 'zibal'

    const co = await fetch(`${BASE}/api/shop/checkout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        contact_name: 'آزمون', contact_phone: '09120000000',
        address: 'تهران، آزمون', gateway,
        // Required by the endpoint (422 «delivery_eta_days الزامی است»
        // without it). The page defaults to 3 (`useState(3)` in
        // CartPage.tsx) and the customer picks from a radio group; this is
        // that same default, not an invented value.
        delivery_eta_days: 3,
      }),
    })
    const coBody = await co.text()
    let parsed = null
    try { parsed = JSON.parse(coBody) } catch { }
    const redirected = co.ok && parsed && (parsed.url || parsed.authority || parsed.gateway)
    check('checkout returns a gateway to redirect to', Boolean(redirected),
      `${co.status} ${coBody.slice(0, 140)}`)

    // ── 5. No console noise on the way ────────────────────────────
    check('no console errors during the flow', consoleErrors.length === 0,
      consoleErrors.slice(0, 2).join(' | '))
  } finally {
    await browser.close()

    // ── Clean up after ourselves ────────────────────────────────────
    // This test runs against a real deployment and, by design, goes as far
    // as creating an order. Measured on the first successful run: order id
    // 60 (9,163,700 T) and four te2e accounts were left in production,
    // because nothing removed them. A test that leaves state behind is how
    // 72 accounts survived eleven green runs.
    //
    // The account carries the `t` marker, so it is removable by the same
    // predicate the back-end suite uses.
    try {
      if (session.username.startsWith(MARK)) {
      // `DELETE /api/auth/account` is the application's own path: it takes
      // the password and the typed username, and the database cascades
      // sessions / cart_items / posts. Orders are KEPT on purpose (a
      // financial record), which is why this run can still leave one
      // `pending` order — said here rather than pretended away.
      const del = await fetch(`${BASE}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          password: 'E2e-pass-2026!',
          confirm_username: session.username,
        }),
      }).catch(e => ({ ok: false, status: 0, text: () => String(e) }))
      console.log(`\n  cleanup: DELETE /api/auth/account -> ${del.status}`)
      if (!del.ok) {
        let body = ''
        try { body = await del.text() } catch { /* ignore */ }
        console.log(`  cleanup FAILED — remove ${session.username} with ` +
          `scripts/purge_test_users.py --apply  (${String(body).slice(0, 120)})`)
      }
    }
  } catch (e) {
    // Cleanup must never fail the test run, but it must be visible.
    console.log(`\n  cleanup threw: ${e && e.message}`)
  }
  }

  const failed = results.filter(r => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length) {
    console.log('failures:')
    for (const f of failed) console.log(`  ✗ [${f.group}] ${f.name} — ${f.detail}`)
  }
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => { console.error('FATAL', e); process.exit(2) })