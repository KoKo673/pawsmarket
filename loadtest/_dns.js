import http from 'k6/http'
export const options = { vus: 1, iterations: 1 }
export default function () {
  const r = http.get('https://example.com', { timeout: '10s' })
  console.log(`example.com -> status=${r.status} err=${r.error || ''}`)
}
