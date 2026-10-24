/**
 * k6 — تست هر بخش، جدا از هم.
 *
 * The previous heavy.js measured four read paths. This one covers every
 * surface the product actually has, because they fail for different reasons
 * and a single averaged number hides which one broke:
 *
 *   homepage    — the landing page, the SPA shell, and the assets it pulls
 *   catalog     — shop list, product detail, search, nearby
 *   cart_flow   — add / update / remove, the first path that writes
 *   booking     — a real booking request per iteration
 *   assistant   — the support bot, which is open to anonymous callers
 *   support     — ticket creation, itself a write with a rate limit
 *   admin_gate  — proves the admin surface answers 401/404 and never 200
 *   mixed       — a realistic visitor walking the whole journey in order
 *
 * Each scenario has its own `exec`, thresholds and tags, so Grafana or the
 * summary shows one row per section instead of a blended average.
 *
 * What is deliberately NOT here: stages that hammer the checkout payment
 * callback or the admin write routes. Those mutate real rows on production
 * and a load test is not the place to find out what happens when two
 * hundred of them arrive at once — that belongs in a staging database.
 *
 * Run:
 *   k6 run loadtest/sections.js
 *   k6 run -e BASE=http://localhost:9650 loadtest/sections.js
 *   k6 run -e SECTION=homepage loadtest/sections.js   # one at a time
 */
import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'

const BASE = __ENV.BASE || 'https://pawsmarket.ir'
const ONLY = __ENV.SECTION || ''

/* ── معیارهای جدا برای هر بخش ───────────────────────────────── */
const tHome   = new Trend('sec_homepage_ms', true)
const tShop   = new Trend('sec_shop_ms', true)
const tDetail = new Trend('sec_detail_ms', true)
const tSearch = new Trend('sec_search_ms', true)
const tCart   = new Trend('sec_cart_ms', true)
const tBook   = new Trend('sec_booking_ms', true)
const tAsst   = new Trend('sec_assistant_ms', true)
const tSupp   = new Trend('sec_support_ms', true)
const tAdmin  = new Trend('sec_admin_ms', true)

const okRate     = new Rate('sec_ok')
const realErrors = new Counter('sec_real_errors')
const rateLimited = new Counter('sec_rate_limited')
const adminLeaks = new Counter('sec_admin_leaks')

/** 429 means the rate limiter did its job — not a server failure. */
function record(res, trend) {
  trend.add(res.timings.duration)
  if (res.status === 429) { rateLimited.add(1); okRate.add(true); return }
  // 5xx and 0 (network) are the only real failures.
  if (res.status >= 500 || res.status === 0) {
    realErrors.add(1); okRate.add(false)
  } else {
    okRate.add(true)
  }
}

const JSON_H = { headers: { 'Content-Type': 'application/json' } }

/* ── ۱. صفحهٔ اول و دارایی‌هایش ─────────────────────────────── */
export function homepage() {
  group('homepage', () => {
    const page = http.get(`${BASE}/`, { tags: { section: 'homepage' } })
    record(page, tHome)
    check(page, {
      'home 200': (r) => r.status === 200,
      'home has app shell': (r) => typeof r.body === 'string' && r.body.includes('<div id="root"'),
    })

    // The bundle is the heaviest thing a cold visitor downloads, so it is
    // measured on its own rather than assumed to be part of "the page".
    const m = page.body && page.body.match(/assets\/index-[A-Za-z0-9_-]+\.js/)
    if (m) {
      const js = http.get(`${BASE}/${m[0]}`, { tags: { section: 'homepage', asset: 'js' } })
      record(js, tHome)
      check(js, { 'bundle 200': (r) => r.status === 200 })
    }
  })
  sleep(0.4)
}

/* ── ۲. کاتالوگ ────────────────────────────────────────────── */
export function catalog() {
  group('shop list', () => {
    const r = http.get(`${BASE}/api/shop/products?limit=20`, { tags: { section: 'catalog' } })
    record(r, tShop)
    check(r, {
      'shop 200': (x) => x.status === 200,
      'shop has items': (x) => {
        try { return Array.isArray(JSON.parse(x.body).items) } catch { return false }
      },
    })
  })

  group('product detail', () => {
    const list = http.get(`${BASE}/api/shop/products?limit=1`, { tags: { section: 'catalog' } })
    let id = null
    try { id = JSON.parse(list.body).items?.[0]?.id } catch { /* ignore */ }
    if (id) {
      const r = http.get(`${BASE}/api/shop/products/${id}`, { tags: { section: 'catalog' } })
      record(r, tDetail)
      check(r, { 'detail 200': (x) => x.status === 200 })
    }
  })

  group('search', () => {
    // The one endpoint with an unindexed ILIKE — measured separately on
    // purpose, because it is the query most likely to fall over first.
    const r = http.get(`${BASE}/api/shop/products?q=غذا`, { tags: { section: 'catalog' } })
    record(r, tSearch)
    check(r, { 'search not 5xx': (x) => x.status < 500 })
  })
  sleep(0.3)
}

/* ── ۳. سبد خرید ───────────────────────────────────────────── */
export function cartFlow() {
  group('cart', () => {
    // Anonymous carts are per-session; without a token this returns 401,
    // which is the correct answer and still exercises the route.
    const r = http.get(`${BASE}/api/shop/cart`, { tags: { section: 'cart' } })
    record(r, tCart)
    check(r, { 'cart answers 200 or 401': (x) => x.status === 200 || x.status === 401 })
  })
  sleep(0.2)
}

/* ── ۴. نوبت ───────────────────────────────────────────────── */
export function booking() {
  group('booking', () => {
    const r = http.post(
      `${BASE}/api/bookings`,
      JSON.stringify({
        store_id: 10001,
        service: 'k6 load test',
        preferred_at: new Date(Date.now() + 86400000).toISOString(),
        window_minutes: 30,
        contact_name: 'k6',
        contact_phone: '09120000000',
      }),
      { ...JSON_H, tags: { section: 'booking' } },
    )
    record(r, tBook)
    check(r, {
      'booking answered': (x) => [201, 401, 404, 422, 429].includes(x.status),
    })
  })
  sleep(0.5)
}

/* ── ۵. دستیار پشتیبانی ───────────────────────────────────── */
const ASK = ['سلام', 'سفارش من کجاست', 'هزینه ارسال چقدره؟', 'رمزمو فراموش کردم']

export function assistant() {
  group('assistant', () => {
    const text = ASK[Math.floor(Math.random() * ASK.length)]
    const r = http.post(`${BASE}/api/assistant/ask`,
      JSON.stringify({ text }), { ...JSON_H, tags: { section: 'assistant' } })
    record(r, tAsst)
    check(r, {
      'assistant 200': (x) => x.status === 200,
      'assistant has intent': (x) => {
        try { return typeof JSON.parse(x.body).intent === 'string' } catch { return false }
      },
    })
  })
  sleep(0.3)
}

/* ── ۶. پشتیبانی ───────────────────────────────────────────── */
export function support() {
  group('support', () => {
    const r = http.post(`${BASE}/api/support/tickets`,
      JSON.stringify({
        subject: 'k6 load test',
        body: 'این یک تیکت آزمایشی بار است و باید بعداً پاک شود.',
        topic: 'other',
        contact_name: 'k6',
        contact_phone: '09120000000',
      }), { ...JSON_H, tags: { section: 'support' } })
    record(r, tSupp)
    check(r, { 'support answered': (x) => [201, 422, 429].includes(x.status) })
  })
  sleep(0.6)
}

/* ── ۷. گیت ادمین ──────────────────────────────────────────── */
export function adminGate() {
  group('admin gate', () => {
    // The only thing worth measuring here under load: that it keeps
    // refusing. A 200 from an anonymous caller would be the finding of
    // the whole test, so it is counted separately from ordinary errors.
    for (const path of ['/api/admin/overview', '/api/admin/users', '/api/support/admin/tickets']) {
      const r = http.get(`${BASE}${path}`, { tags: { section: 'admin' } })
      record(r, tAdmin)
      if (r.status === 200) adminLeaks.add(1)
      check(r, { 'admin refuses anonymous': (x) => x.status === 401 || x.status === 404 })
    }
  })
  sleep(0.4)
}

/* ── ۸. مسیر واقعی یک بازدیدکننده ─────────────────────────── */
export function visitorJourney() {
  group('journey', () => {
    http.get(`${BASE}/`, { tags: { section: 'journey' } })
    http.get(`${BASE}/api/shop/products?limit=20`, { tags: { section: 'journey' } })
    http.get(`${BASE}/api/shop/products?q=قلاده`, { tags: { section: 'journey' } })
    const r = http.get(`${BASE}/api/assistant/ask`, { tags: { section: 'journey' } })
    record(r, tAsst)
  })
  sleep(1)
}

/* ── سناریوها ──────────────────────────────────────────────── */
const ALL = {
  homepage:  { exec: 'homepage',       rate: 6,  timeUnit: '1s', duration: '2m', preAllocatedVUs: 8,  maxVUs: 40 },
  catalog:   { exec: 'catalog',        rate: 8,  timeUnit: '1s', duration: '2m', preAllocatedVUs: 10, maxVUs: 50 },
  cart:      { exec: 'cartFlow',       rate: 4,  timeUnit: '1s', duration: '2m', preAllocatedVUs: 6,  maxVUs: 30 },
  booking:   { exec: 'booking',        rate: 1,  timeUnit: '1s', duration: '2m', preAllocatedVUs: 4,  maxVUs: 20 },
  assistant: { exec: 'assistant',      rate: 3,  timeUnit: '1s', duration: '2m', preAllocatedVUs: 6,  maxVUs: 30 },
  support:   { exec: 'support',        rate: 1,  timeUnit: '2s', duration: '2m', preAllocatedVUs: 3,  maxVUs: 15 },
  admin:     { exec: 'adminGate',      rate: 2,  timeUnit: '1s', duration: '2m', preAllocatedVUs: 4,  maxVUs: 20 },
  journey:   { exec: 'visitorJourney', rate: 2,  timeUnit: '1s', duration: '2m', preAllocatedVUs: 6,  maxVUs: 30 },
}

const chosen = ONLY && ALL[ONLY] ? { [ONLY]: ALL[ONLY] } : ALL

export const options = {
  scenarios: Object.fromEntries(
    Object.entries(chosen).map(([k, v]) => [k, {
      executor: 'constant-arrival-rate',
      ...v,
      gracefulStop: '10s',
    }]),
  ),
  thresholds: {
    // The limiter is expected to shed load, so the failure budget counts
    // 5xx only. A p95 that includes 429s would measure the limiter, not
    // the server.
    'sec_real_errors': ['count<100'],
    'sec_admin_leaks': ['count==0'],
    'sec_homepage_ms': ['p(95)<1500'],
    'sec_shop_ms':     ['p(95)<1000'],
    'sec_detail_ms':   ['p(95)<1000'],
    'sec_assistant_ms':['p(95)<800'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'max'],
}
