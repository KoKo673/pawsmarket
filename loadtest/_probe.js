import http from 'k6/http'
const BASE = __ENV.BASE || 'https://pawsmarket.ir'
export const options = { vus: 2, duration: '20s' }
export default function () {
  const r = http.get(`${BASE}/api/shop/products?limit=20`)
  if (r.status !== 200) console.log(`status=${r.status} dur=${r.timings.duration}ms`)
}
