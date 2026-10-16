import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Emit a GitHub Pages SPA fallback.
 *
 * GitHub Pages has no server-side rewrite: a request for /explore, /pet/12 or
 * /explore?preset=vets is served from disk, and when no such file exists it
 * answers 404 with its own "File not found" page. The app worked only because
 * visitors always arrived at the root and clicked through — every direct link,
 * every refresh, every shared URL, and every browser Back was a dead page.
 *
 * The fix is the documented one: publish a copy of index.html as 404.html. Pages
 * serves it for any unmatched path and the client router takes over, so the URL
 * in the address bar stays the real one — no redirect, no query string lost.
 */

/**
 * Make relative links in the emitted HTML absolute.
 *
 * 404.html is served for /deep/path as well as at the root, so anything written
 * relative to the document would resolve against that path and 404 again.
 */
function absolutise(html: string, base: string): string {
  const prefix = base.endsWith('/') ? base : `${base}/`
  const attr = /(href|src)="([^"]*)"/gi
  return html.replace(attr, (whole, name: string, url: string) => {
    if (/^(https?:)?\/\//i.test(url) || /^(#|mailto:|tel:|data:)/i.test(url)) {
      return whole
    }
    if (url.startsWith('/')) return whole
    return `${name}="${prefix}${url}"`
  })
}

export function buildSpaFallback(outDir: string, base: string): string {
  const index = join(outDir, 'index.html')
  /* Fail with something a person can act on. A bare ENOENT from readFileSync
     is what made this take an hour to trace: it names a file but not the
     decision that produced the path. The one way to get here is a build that
     wrote somewhere other than the directory this was handed. */
  if (!existsSync(index)) {
    throw new Error(
      `spaFallback: no index.html in ${outDir}. ` +
      'The build output directory is empty or is not the one this was given — ' +
      'check --outDir and the plugin that passes it.',
    )
  }
  let html = readFileSync(index, 'utf-8')

  html = absolutise(html, base)
  if (!html.includes('name="robots"')) {
    html = html.replace('<head>', '<head>\n    <meta name="robots" content="noindex">')
  }

  const target = join(outDir, '404.html')
  writeFileSync(target, html, 'utf-8')
  return target
}