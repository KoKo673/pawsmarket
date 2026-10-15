/**
 * Serve a production build for auditing: static files plus an /api proxy.
 *
 * Lighthouse has to measure what users actually download, and `vite dev`
 * serves unbundled ESM — the first run reported LCP 87s and 65s of
 * "unminified JavaScript", which describes the dev server rather than the
 * product. This serves a real build with a real proxy so the numbers mean
 * something.
 *
 *   node scripts/serve_dist.mjs [--dir dist-audit] [--port 4173]
 *                               [--api http://127.0.0.1:9650]
 *
 * SPA fallback: unknown paths return index.html, like the nginx config the
 * VPS will use, so a deep link behaves the same here as in production.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, request as httpRequest } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const DIR = resolve(arg('dir', 'dist-audit'))
const PORT = Number(arg('port', '4173'))
const API = arg('api', 'http://127.0.0.1:9650')
const apiUrl = new URL(API)

if (!existsSync(join(DIR, 'index.html'))) {
  console.error(`no index.html in ${DIR} — build first`)
  process.exit(2)
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

function proxy(req, res) {
  const upstream = {
    hostname: apiUrl.hostname,
    port: apiUrl.port || 80,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: apiUrl.host },
  }
  const p = httpRequest(upstream, (r) => {
    res.writeHead(r.statusCode ?? 502, r.headers)
    r.pipe(res)
  })
  p.on('error', (e) => {
    res.writeHead(502, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ detail: `proxy error: ${e.message}` }))
  })
  req.pipe(p)
}

function serveFile(path, res) {
  res.writeHead(200, {
    'content-type': TYPES[extname(path)] ?? 'application/octet-stream',
    // Hashed asset names make long caching safe; index.html must not be
    // cached or a rebuild would be measured through the old shell.
    'cache-control': extname(path) === '.html'
      ? 'no-store'
      : 'public, max-age=31536000, immutable',
  })
  createReadStream(path).pipe(res)
}

createServer((req, res) => {
  if (req.url.startsWith('/api/') || req.url.startsWith('/media/')) {
    return proxy(req, res)
  }
  const clean = decodeURIComponent(req.url.split('?')[0])
  // normalize() collapses .. before the join, so a traversal attempt cannot
  // escape DIR — the guard below is the backstop.
  const candidate = join(DIR, normalize(clean))
  if (!candidate.startsWith(DIR)) {
    res.writeHead(403).end('forbidden')
    return
  }
  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return serveFile(candidate, res)
  }
  serveFile(join(DIR, 'index.html'), res)
}).listen(PORT, '127.0.0.1', () => {
  console.log(`  serving ${DIR}`)
  console.log(`  http://127.0.0.1:${PORT}   /api -> ${API}`)
})
