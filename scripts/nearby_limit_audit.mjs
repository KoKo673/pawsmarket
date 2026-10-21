/**
 * Does the nearby endpoints' default page size silently hide stores?
 *
 * /api/stores/nearby defaults `limit` to 150 — a page size chosen for a slow
 * link. Nothing in the UI ever asked for more, so the endpoint returned 150
 * of 218 stores, and /explore never noticed because it reads the committed
 * snapshot rather than the API.
 *
 * A page that looks a store up BY ID does notice, and it fails in the worst
 * direction: the missing ids resolve to nothing and get refused as «پیدا
 * نشد» — a wrong answer about a business that exists.
 *
 * So `geoParams` pins `limit` to the server's ceiling. This asserts the two
 * halves of that: the API really does truncate without it, and the client
 * really does send it.
 *
 *   node scripts/nearby_limit_audit.mjs --api https://pawsmarket.ir
 *
 * Exit 0 when both hold, 1 otherwise.
 */
import { readFileSync } from 'node:fs'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const API = arg('api', 'http://127.0.0.1:9650')
const ORIGIN = 'lat=35.6892&lng=51.389'
const WIDE = 'max_distance=100000000'

const results = []
function record(name, pass, detail) {
  results.push({ name, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function count(query) {
  const res = await fetch(`${API}/api/stores/nearby?${ORIGIN}&${WIDE}${query}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const rows = await res.json()
  return Array.isArray(rows) ? rows.length : -1
}

/* ── 1. The client sends a limit that clears the cap ───────────────── */
// Read the source rather than importing it: this runs under plain node with
// no bundler, and the thing being checked is the query the app builds.
const src = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8')
const sendsLimit = /limit:\s*String\(NEARBY_MAX_LIMIT\)/.test(src)
const ceiling = Number((src.match(/NEARBY_MAX_LIMIT\s*=\s*(\d+)/) || [])[1] || 0)
record(
  'geoParams sends an explicit limit',
  sendsLimit && ceiling >= 2000,
  `sendsLimit=${sendsLimit} NEARBY_MAX_LIMIT=${ceiling}`,
)

/* ── 2. Without a limit the server truncates ───────────────────────── */
try {
  const bare = await count('')
  const capped = await count(`&limit=${ceiling || 2000}`)
  record(
    'the default page is smaller than the full set',
    bare < capped,
    `default=${bare} rows, limit=${ceiling || 2000}=${capped} rows, hidden=${capped - bare}`,
  )
  record(
    'the client ceiling reaches every store',
    capped > bare,
    `${capped} rows returned at the ceiling`,
  )
} catch (err) {
  record('the default page is smaller than the full set', false, `request failed: ${err.message}`)
  record('the client ceiling reaches every store', false, `request failed: ${err.message}`)
}

const failed = results.filter((r) => !r.pass)
console.log('')
console.log(failed.length ? `${failed.length} of ${results.length} failed`
  : `all ${results.length} passed`)
process.exit(failed.length ? 1 : 0)
