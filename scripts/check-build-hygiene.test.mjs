/**
 * Guards the two things that let stale build chunks pile up in production.
 *
 * ── What went wrong, measured 2026-11-23 ────────────────────────────
 * The live container held 222 files in `assets/` for 72 distinct names —
 * eight copies of SupportPage, eight of AdminSupportPage — and every one
 * was still publicly served with `Cache-Control: immutable`.
 *
 * Two separate causes, both silent:
 *
 *   1. `COPY --from=build /app/dist /usr/share/nginx/html` in a Dockerfile
 *      MERGES into a directory that already exists (the nginx base image
 *      has it). Every build added its chunks beside the previous ones.
 *
 *   2. A request for a chunk the current image does not carry fell through
 *      the SPA fallback and got `index.html` with 200 — a module import
 *      handed a page of HTML. That reads as a blank screen, not as the 404
 *      that would make a stale tab reload.
 *
 * Neither is visible by looking at the site. The file count was the
 * symptom, and it only appears months later.
 *
 * ── Why these assert on file contents, not on `dist/` ───────────────
 * The defect is in the Dockerfile and the nginx config, not in the
 * build output. Asserting on `dist/` would pass every time — Vite always
 * writes a clean directory; it is what happens AFTER that loses.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')


function readOptional(name) {
  const p = join(ROOT, name)
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}

/** Everything after the nginx stage, where dist is actually copied. */
function serveStage(dockerfile) {
  const idx = dockerfile.indexOf('FROM nginx:')
  assert.notEqual(idx, -1, 'the Dockerfile no longer has an nginx serve stage')
  return dockerfile.slice(idx)
}

test('the serve stage clears assets/ before copying the new build', () => {
  const src = readOptional('Dockerfile')
  if (src === null) {
    // The frontend Dockerfile lives in the deployment repo for some
    // checkouts; skipping beats failing a clean tree for a file this repo
    // does not own.
    return
  }
  const stage = serveStage(src)
  // Anchored at line start: the comment above the rule QUOTES the COPY
  // line as prose, so a plain indexOf finds the quotation first and the
  // ordering assertion then passes for the wrong reason (or fails for
  // one). Measured on this test's first run.
  const rmAt = stage.search(/^RUN rm -rf/m)
  const copyAt = stage.search(/^COPY --from=build/m)

  assert.notEqual(rmAt, -1,
    'the serve stage no longer clears assets/ before COPY — the image '
    + 'will accumulate one set of chunks per build (measured: 222 files '
    + 'for 72 names)')
  assert.notEqual(copyAt, -1, 'the serve stage no longer copies dist at all')
  assert.ok(rmAt < copyAt,
    'the rm comes AFTER the COPY, which deletes the build it just made')
})

test('the removal is scoped to the site paths, not the whole doc root', () => {
  const src = readOptional('Dockerfile')
  if (src === null) return
  const stage = serveStage(src)
  const at = stage.search(/^RUN rm -rf/m)
  assert.notEqual(at, -1, 'no RUN rm -rf line in the serve stage')
  // Join continuation lines so a wrapped command is read as one.
  const command = stage.slice(at, at + 400).split('\n\n')[0].replace(/\\\n/g, ' ')

  assert.match(command, /\/usr\/share\/nginx\/html\/assets/,
    'the rm must name the assets directory explicitly')
  // nginx ships its own error pages in the document root; wiping it would
  // surface only when something 404s, which is the worst moment.
  assert.doesNotMatch(command.trim(),
    /rm -rf \/usr\/share\/nginx\/html\s*$/,
    'the rm must not wipe the whole document root')
})

test('a missing chunk 404s instead of returning the SPA shell', () => {
  const conf = readOptional('nginx.conf')
  if (conf === null) return

  const start = conf.indexOf('location /assets/')
  assert.notEqual(start, -1, 'nginx.conf has no /assets/ location')
  // The block ends at the first closing brace at its own indent level.
  const block = conf.slice(start, conf.indexOf('\n    }', start) + 6)

  assert.match(block, /try_files\s+\$uri\s+=404/,
    'a request for a missing hashed chunk must 404; without try_files it '
    + 'reaches `location /`, gets index.html with 200, and a module import '
    + 'receives HTML — a blank screen instead of a reload')

  // The cache header is the reason a stale chunk matters at all; if it
  // ever stops being immutable, this test should be revisited deliberately.
  assert.match(block, /immutable/,
    'the assets Cache-Control changed — re-read whether the 404 rule is '
    + 'still the right mitigation')
})

test('exactly one /assets/ block exists', () => {
  const conf = readOptional('nginx.conf')
  if (conf === null) return
  const count = (conf.match(/location \/assets\//g) || []).length
  assert.equal(count, 1,
    `nginx refuses to start on a duplicate location; found ${count}`)
})