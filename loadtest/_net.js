import http from 'k6/http'
export const options = { vus: 1, iterations: 1 }
export default function () {
  for (const url of ['http://pawsmarket.ir/', 'https://pawsmarket.ir/', 'https://pawsmarket.ir/api/health']) {
    const r = http.get(url, { timeout: '15s' })
    console.log(`${url} -> status=${r.status} dur=${r.timings.duration}ms err=${r.error || ''}`)
  }
}
