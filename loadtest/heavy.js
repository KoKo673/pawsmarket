/**
 * k6 — تست سنگین.
 *
 * Four separate scenarios, because they fail for different reasons and
 * averaging them hides which one is slow:
 *
 *   browse   — a visitor reading the shop
 *   search   — the one endpoint with an unindexed ILIKE
 *   detail   — single-product lookups, the hottest path
 *   api_mix  — anonymous catalogue + health, the background chatter
 *
 * The limits are deliberately pushed past what the rate limiter allows,
 * so the run also answers "where is the ceiling?" rather than only "is
 * it fast at a polite rate?".
 */
import http from 'k6/http'
import { check } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'

const BASE = __ENV.BASE || 'https://pawsmarket.ir'

const browseMs = new Trend('browse_ms', true)
const searchMs = new Trend('search_ms', true)
const detailMs = new Trend('detail_ms', true)
const apiMs = new Trend('api_ms', true)
const realErrors = new Rate('real_errors')
const limited = new Counter('rate_limited')

export const options = {
  scenarios: {
    browse: {
      executor: 'ramping-arrival-rate',
      startRate: 2, timeUnit: '1s',
      stages: [
        { duration: '30s', target: 20 },
        { duration: '60s', target: 40 },
        { duration: '30s', target: 40 },
        { duration: '15s', target: 0 },
      ],
      preAllocatedVUs: 40, maxVUs: 120,
      exec: 'browse',
    },
    search: {
      executor: 'constant-arrival-rate',
      rate: 6, timeUnit: '1s', duration: '90s',
      preAllocatedVUs: 20, maxVUs: 60,
      exec: 'search',
    },
    detail: {
      executor: 'constant-arrival-rate',
      rate: 8, timeUnit: '1s', duration: '90s',
      preAllocatedVUs: 25, maxVUs: 80,
      exec: 'detail',
    },
    api_mix: {
      executor: 'constant-arrival-rate',
      rate: 5, timeUnit: '1s', duration: '90s',
      preAllocatedVUs: 15, maxVUs: 50,
      exec: 'apiMix',
    },
  },
  thresholds: {
    real_errors: ['rate<0.02'],
    browse_ms: ['p(95)<1500'],
    search_ms: ['p(95)<2000'],
    detail_ms: ['p(95)<1200'],
    api_ms: ['p(95)<1200'],
  },
}

function track(res, trend, label) {
  trend.add(res.timings.duration)
  // 429 is the limiter working, not a failure. Counting it as one is how
  // the first version reported a 91% failure rate on a healthy system.
  if (res.status === 429) { limited.add(1); return true }
  const ok = res.status >= 200 && res.status < 400
  realErrors.add(!ok)
  check(res, { [`${label} ok`]: () => ok })
  return ok
}

export function browse() {
  const r = http.get(`${BASE}/api/shop/products?limit=24`, { tags: { name: 'browse' } })
  track(r, browseMs, 'browse')
}

export function search() {
  const qs = ['قلاده', 'غذا', 'گربه', 'سگ', 'قفس', 'شامپو']
  const q = qs[Math.floor(Math.random() * qs.length)]
  const r = http.get(`${BASE}/api/shop/products?q=${encodeURIComponent(q)}`, {
    tags: { name: 'search' },
  })
  track(r, searchMs, 'search')
}

export function detail() {
  const r = http.get(`${BASE}/api/shop/products/${Math.floor(Math.random() * 220) + 1}`, {
    tags: { name: 'detail' },
  })
  // 404 for a missing id is a correct answer, not an error.
  detailMs.add(r.timings.duration)
  if (r.status === 429) { limited.add(1); return }
  const ok = r.status === 200 || r.status === 404
  realErrors.add(!ok)
  check(r, { 'detail 200 or 404': () => ok })
}

export function apiMix() {
  const paths = ['/health', '/api/stores/nearby?lat=35.7&lng=51.4&max_distance=20000&limit=50']
  const r = http.get(BASE + paths[Math.floor(Math.random() * paths.length)], {
    tags: { name: 'api' },
  })
  track(r, apiMs, 'api')
}
