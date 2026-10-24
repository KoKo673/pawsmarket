import http from 'k6/http'
import { check } from 'k6'
export const options = { vus: 1, iterations: 1 }
export default function () {
  // 1) http only (no TLS)
  const a = http.get('http://185.143.233.132/', { timeout: '12s', headers: { Host: 'pawsmarket.ir' } })
  console.log(`plain-IP http -> ${a.status} ${a.error||''}`)

  // 2) https by IP with SNI forced through Host
  const b = http.get('https://185.143.233.132/api/health', { timeout: '12s', headers: { Host: 'pawsmarket.ir' } })
  console.log(`plain-IP https -> ${b.status} ${b.error||''}`)

  // 3) https with explicit TLS options
  const c = http.get('https://pawsmarket.ir/api/health', {
    timeout: '12s',
    tlsVersion: 'tls1.2',
    headers: { 'User-Agent': 'k6/1.0' },
  })
  console.log(`tls1.2 -> ${c.status} ${c.error||''}`)
}
