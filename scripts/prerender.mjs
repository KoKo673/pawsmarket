/**
 * Write real HTML for the pages a search engine needs to read.
 *
 * ── The measured problem ──────────────────────────────────────────────
 * The deployed site answers every route with the same empty shell:
 *
 *     $ curl https://pawsmarket.ir/store/pansyvn-ghlah-hyvanat | grep -c 'پانسیون قلعه'
 *     0
 *
 * The store name, address, phone and hours are fetched by the browser after
 * the bundle boots. Googlebot runs JavaScript and would eventually see them;
 * the link preview in Telegram, WhatsApp, Twitter and Slack does not — it
 * reads the raw HTML and finds nothing but a title tag. For a page whose
 * whole purpose is being pasted into a bio, that is the difference between
 * a card with a photo and a bare URL.
 *
 * ── Why build-time and not SSR ────────────────────────────────────────
 * The roadmap says prerender, not SSR, and that is the right call here: the
 * content of a store page changes when a clinic edits its profile, not per
 * request. One extra file per store at build time costs nothing at runtime,
 * adds no Node process to the server, and cannot fall over under load.
 *
 * If the API is unreachable at build time this exits 0 and does nothing —
 * a build must not fail because production is briefly down. The shell is
 * still what it was; the next build picks the pages up.
 *
 * ── What it does NOT do ───────────────────────────────────────────────
 * It does not render React. The injected block is the same semantic content
 * the page shows (name, category, address, phone, hours, description) plus
 * JSON-LD, inside the existing shell. The client router replaces it on
 * hydration, so a visitor sees no difference — only a crawler does.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = (process.env.PRERENDER_API || 'https://pawsmarket.ir').replace(/\/$/, '')
const OUT = process.env.PRERENDER_OUT || 'dist'

// Google Search Console ownership token. Read from the build environment
// (Vite bakes VITE_* into the bundle; this Node script reads the same values
// from .env.production so the built HTML matches the bundle even when
// process.env is unset — docker build only passed VITE_GA4_ID, so GSC was
// empty at prerender). When empty, the placeholder in index.html is dropped —
// a page shipped without the operator's token should not carry a fake verification line.
function readDotEnv(name) {
  if (process.env[name]) return process.env[name]
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const envFile = resolve(here, '..', '.env.production')
    const text = readFileSync(envFile, 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(new RegExp(`^${name}=(.*)$`))
      if (m) return m[1].trim()
    }
  } catch { /* file not available — fall through to empty */ }
  return ''
}
const GSC_TOKEN = readDotEnv('VITE_GSC_VERIFICATION')

/** Escape text for interpolation into HTML. */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const CATEGORY_FA = {
  vet: 'دامپزشکی', groomer: 'آرایشگاه', boarding: 'پانسیون',
  shelter: 'پناهگاه', shop: 'فروشگاه', cafe: 'کافه',
}

/** `09:00:00` → `09:00`; anything unexpected is passed through. */
function hhmm(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

async function getJson(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  return res.json()
}

/**
 * The block a crawler reads. It replaces nothing — the client overwrites
 * #root on hydration — so it has to be honest content, not marketing.
 */
function contentFor(store) {
  const parts = [
    `<h1>${esc(store.name)}</h1>`,
  ]
  const cat = CATEGORY_FA[store.category]
  if (cat) parts.push(`<p>${esc(cat)}</p>`)
  if (store.description) parts.push(`<p>${esc(store.description)}</p>`)
  if (store.address) parts.push(`<p>نشانی: ${esc(store.address)}</p>`)
  if (store.phone) parts.push(`<p>تلفن: <a href="tel:${esc(store.phone)}">${esc(store.phone)}</a></p>`)
  const open = hhmm(store.opens_at)
  const close = hhmm(store.closes_at)
  if (open && close) parts.push(`<p>ساعت کاری: ${esc(open)} تا ${esc(close)}</p>`)
  return parts.join('\n      ')
}

/**
 * schema.org LocalBusiness — what turns a link into a result with hours and
 * a phone number. `@type` stays LocalBusiness rather than a narrower
 * VeterinaryCare because most rows are groomers and boarding, and guessing
 * wrongly is worse than saying less.
 */
function jsonLd(store, url, origin) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: store.name,
    url,
  }
  if (store.description) data.description = store.description
  if (store.phone) data.telephone = store.phone
  if (store.address) {
    data.address = { '@type': 'PostalAddress', addressCountry: 'IR', streetAddress: store.address }
  }
  if (store.lat != null && store.lng != null) {
    data.geo = { '@type': 'GeoCoordinates', latitude: store.lat, longitude: store.lng }
  }
  const open = hhmm(store.opens_at)
  const close = hhmm(store.closes_at)
  if (open && close) {
    data.openingHoursSpecification = {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: open,
      closes: close,
    }
  }
  // Same origin as the canonical URL above. Schema.org wants an absolute
  // URL for `image`, and on a preview build the API host is not the host
  // the page is served from — pointing the photo at the other one makes
  // the structured data describe an image the page never shows.
  if (store.image_url) data.image = `${origin}/${String(store.image_url).replace(/^\//, '')}`
  return JSON.stringify(data, null, 2)
    // ── Why this is escaped at all ───────────────────────────────────
    // A JSON string can contain `</script>`, and the HTML parser ends a
    // <script> element at that sequence regardless of the JSON around it.
    // A store name of `x</script><img src=… onerror=…>` would therefore
    // become live markup in 447 prerendered files — stored XSS by way of a
    // business name.
    //
    // `<\/` is the same string in JSON ('\/' is an escaped solidus) and the
    // parser never sees `</script>`, so the data survives and the tag does
    // not close early. Escaping `<` alone would also work but changes the
    // value for anyone reading the JSON; this changes nothing but the bytes.
    .replace(/<\//g, '<\\/')
}

/**
 * The og:/twitter: block for one page.
 *
 * Required by ogp.me: og:title, og:type, og:image, og:url. The rest are the
 * ones the vendors' crawlers actually read. `og:image` must be absolute —
 * ogp.me says so and every scraper resolves it against nothing.
 *
 * `og:image:alt` is emitted because ogp.me pairs it with og:image, and
 * because a preview with no alt is a preview a screen-reader user cannot
 * resolve at all.
 */
function ogBlock({ title, desc, url, image, imageAlt, type = 'website' }) {
  const t = esc(title)
  const d = esc(desc)
  return [
    `<meta property="og:type" content="${esc(type)}" />`,
    `<meta property="og:site_name" content="پازمارکت" />`,
    `<meta property="og:locale" content="fa_IR" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ].join('\n    ')
}

/** Absolute URL for the site's own og:image, whatever origin this build is for. */
function ogImageFor(origin, rel) {
  return `${origin}${rel}`
}

function page(store, shell, url, origin) {
  const title = `${store.name} — پازمارکت`
  const desc = (store.description || `${store.name} در پازمارکت`).slice(0, 155)

  // ── Every replacement is checked ─────────────────────────────────
  // These are regexes against the built shell, and an unmatched one is
  // silent: the page is still written, still has a correct store title, and
  // its body is the generic shell — a crawler-visible page that says
  // nothing about the store, produced by a build that reports success.
  // Measured before this check: all four patterns DO match today, so the
  // failure mode was purely about a future change to index.html.
  //
  // `apply` throws instead of returning the input, which turns a silent SEO
  // regression into a build failure at the one moment someone can see it.
  // The block is caught at the call site so a shell change does not take
  // the whole build with it, but it does stop writing page files.
  let html = shell
  const misses = []
  function apply(re, replacement, label) {
    if (!re.test(html)) { misses.push(label); return }
    // A replacement string is not a template: `$&`, `` $` `` and `$'` in a
    // store's own name would be substituted by String.replace. A function
    // is the only form where the text is used literally.
    html = html.replace(re, () => replacement)
  }

  // Swap the generic title and description for this store's.
  apply(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`, 'title')
  apply(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${esc(desc)}" />`,
    'description',
  )
  // Social preview for THIS store. The shell's og: block describes the site;
  // leaving it here would make 343 store pages share one preview card that
  // never names the store a visitor is about to open.
  //
  // The image is the site card, not the store's own photo: store photos are
  // 820px on the long edge, under the 1200x630 the crawlers want, and a
  // stretched photo reads worse than one consistent card. When a store has
  // its own photo we name it in the description instead — honest about what
  // the card shows.
  apply(
    /<meta\s+property="og:title"[^>]*>/,
    `<meta property="og:title" content="${esc(title)}" />`,
    'og:title',
  )
  apply(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${esc(desc)}" />`,
    'og:description',
  )
  apply(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${esc(url)}" />`,
    'og:url',
  )
  apply(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:type" content="business.business" />`,
    'og:type',
  )
  apply(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    'twitter:title',
  )
  apply(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    'twitter:description',
  )
  // Canonical, so the slug is the address even if someone links an id.
  apply(
    /<\/head>/,
    `  <link rel="canonical" href="${esc(url)}" />\n` +
    `  <script type="application/ld+json">\n${jsonLd(store, url, origin)}\n  </script>\n</head>`,
    'canonical+jsonld',
  )
  // Real content inside #root; the client replaces it on hydration.
  apply(
    /<div id="root">\s*<\/div>/,
    `<div id="root">\n      ${contentFor(store)}\n    </div>`,
    'root-content',
  )

  if (misses.length) {
    return { html: null, misses }
  }
  return { html, misses }
}

async function main() {
  let shell
  try {
    shell = await readFile(join(OUT, 'index.html'), 'utf8')
  } catch {
    console.log('[prerender] no dist/index.html — nothing to do')
    return
  }

  // ── Site-level social preview ───────────────────────────────────
  // `index.html` carries a marker comment instead of the tags themselves,
  // because og:image must be an absolute URL and the origin is only known
  // here. Filling it here means the SPA shell and every prerendered page
  // start from a page that already has a preview card.
  const origin = process.env.PRERENDER_ORIGIN || API
  const siteTitle = 'پازمارکت — حیوانات و لوازم نزدیک شما'
  const siteDesc =
    'حیوانات خانگی، لوازم و مراکز خدماتی نزدیک شما روی یک نقشه‌ی زنده.'
  const ogImage = ogImageFor(origin, '/og-image.jpg')
  // The alt must describe the file that is actually served. When the card
  // was rebuilt from the brand creative the copy still described the old
  // one (a paw mark and a dog); an alt that names things not in the picture
  // is worse than no alt, because a screen-reader user is told to expect
  // something that is not there.
  const ogAlt =
    'پازمارکت — پیش‌نمایش اپلیکیشن با کارت یک گربه و یک پانسیون، ' +
    'و عنوان «نزدیک‌ترین را ببین»'

  if (shell.includes('<!--open-graph-placeholder-->')) {
    shell = shell.replace(
      /<!--open-graph-placeholder-->/,
      () => ogBlock({
        title: siteTitle,
        desc: siteDesc,
        url: `${origin}/`,
        image: ogImage,
        imageAlt: ogAlt,
      }),
    )
    console.log('[prerender] site og:/twitter: block injected')
  } else {
    // Not a failure: an page shipped without a preview card is a silent
    // regression, so say so loudly rather than writing it quietly.
    console.log('[prerender] WARNING: og: placeholder missing from index.html')
  }

  // Search Console verification meta. index.html ships a placeholder
  // comment; only a real token from VITE_GSC_VERIFICATION becomes a
  // <meta name="google-site-verification">. Without a token the
  // placeholder comment is removed entirely — a page shipped without the
  // operator's token should not carry a fake verification line, and must
  // not ship the placeholder as evidence of anything either.
  shell = GSC_TOKEN
    ? shell.replace(
        /<!--google-site-verification-->/,
        `<meta name="google-site-verification" content="${esc(GSC_TOKEN)}" />`,
      )
    : shell.replace(/\s*<!--google-site-verification-->/, '')
  await writeFile(join(OUT, 'index.html'), shell, 'utf8')
  console.log(
    GSC_TOKEN
      ? '[prerender] Search Console verification meta injected'
      : '[prerender] no Search Console token — placeholder line removed',
  )

  // ── 404.html ───────────────────────────────────────────────────────
  // The vite plugin copies index.html to 404.html in closeBundle, which
  // runs BEFORE this script — so 404.html was shipping with the raw
  // `<!--open-graph-placeholder-->` comment still in it. Measured after
  // the first og: build: 343 store pages and index.html had the tags,
  // 404.html had the comment and no tags. A 404 is a page people land on
  // from a stale link, so it is exactly a page that gets shared.
  //
  // Rewritten from the finished shell rather than re-rendered, so the two
  // can never disagree about the tags.
  try {
    await writeFile(join(OUT, '404.html'), shell, 'utf8')
    console.log('[prerender] 404.html refreshed from the finished shell')
  } catch {
    // No 404.html means the plugin did not write one; that is its own
    // problem to report, not this script's.
  }

  // Every store, not the first page: the endpoint caps `limit` at 2000 and
  // paginates with `offset`, and a build that silently rendered 200 of 447
  // would look fine while two thirds of the site stayed invisible.
  let stores = []
  try {
    const PAGE = 500
    for (let offset = 0; ; offset += PAGE) {
      const chunk = await getJson(
        `/api/stores/nearby?lat=35.6892&lng=51.389&max_distance=500000` +
        `&limit=${PAGE}&offset=${offset}`)
      const rows = Array.isArray(chunk) ? chunk : (chunk.items ?? [])
      stores.push(...rows)
      if (rows.length < PAGE) break
      if (offset > 20000) break      // a runaway guard, not an expected path
    }
    // The API excludes competitor pet shops, but this prerender writes a
    // static file per row and those files outlive the build. A `shop` row
    // reaching here would mint a permanent, indexed page for another store —
    // exactly what the exclusion exists to prevent. Filtering again costs
    // nothing and does not depend on the endpoint being redeployed in step
    // with this one.
    const before = stores.length
    stores = stores.filter((s) => s.category !== 'shop')
    if (stores.length !== before) {
      console.log(`[prerender] dropped ${before - stores.length} shop row(s)`)
    }
  } catch (err) {
    // A build must not fail because the API is briefly unreachable. The
    // shell stays as it was and the next build picks the pages up.
    console.log(`[prerender] API unreachable (${err.message}) — skipping`)
    return
  }

  let written = 0
  for (const s of stores) {
    if (!s.slug) continue
    const url = `${API}/store/${s.slug}`
    const { html, misses } = page(s, shell, url, origin)
    if (!html) {
      // The shell changed shape. Writing this page would publish a file
      // that looks prerendered and says nothing about the store, and the
      // sitemap would point crawlers at it. Stopping is the only honest
      // outcome — the previous build's pages stay in dist.
      console.error(
        `[prerender] index.html no longer matches: ${misses.join(', ')} — ` +
        'no pages written. Fix the patterns in page() or the shell.')
      process.exitCode = 1
      return
    }
    const target = join(OUT, 'store', s.slug, 'index.html')
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, html, 'utf8')
    written += 1
  }

  // ── sitemap.xml ────────────────────────────────────────────────────
  // `robots.txt` has pointed at this file all along, and it did not exist:
  // nginx fell through to the SPA and answered with index.html and a 200.
  // A crawler fetched "the sitemap", got HTML, and reported a parse error —
  // the same trap robots.txt itself documents having been in.
  //
  // Generated from the same rows as the pages, so the two cannot drift: a
  // store that has a page is in the sitemap, and one that does not is not.
  // Only URLs that actually got a prerendered file are listed, because
  // sending Google to a 301 or an empty shell is worse than omission.
  const urls = stores.filter((s) => s.slug).map((s) => {
    const loc = `${API}/store/${s.slug}`
    // lastmod is when the row itself last changed, not build time: a build
    // timestamp on every URL tells a crawler nothing and gets ignored.
    const stamp = s.enriched_at || s.updated_at || null
    return { loc, lastmod: stamp ? String(stamp).slice(0, 10) : null }
  })
  const staticPages = [
    { loc: `${API}/`, lastmod: null },
    { loc: `${API}/explore`, lastmod: null },
    { loc: `${API}/shop`, lastmod: null },
    // The pages a buyer or a crawler looks for to decide the site is real.
    // Neither was in the sitemap before: /privacy was not there and had no
    // inbound link, /terms did not exist. A trust page that cannot be
    // found from outside the site may as well not exist.
    { loc: `${API}/terms`, lastmod: null },
    { loc: `${API}/privacy`, lastmod: null },
  ]
  const body = [...staticPages, ...urls]
    .map((u) => (
      '  <url>\n' +
      `    <loc>${esc(u.loc)}</loc>\n` +
      (u.lastmod ? `    <lastmod>${esc(u.lastmod)}</lastmod>\n` : '') +
      '  </url>'
    ))
    .join('\n')
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body + '\n</urlset>\n'
  await writeFile(join(OUT, 'sitemap.xml'), sitemap, 'utf8')
  console.log(`[prerender] sitemap.xml with ${urls.length + staticPages.length} URLs`)

  // The list page and the root get a title that says what the site is,
  // which they already have — but the root should also carry the
  // organisation JSON-LD so the site itself can be a result.
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'پازمارکت',
    url: API,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${API}/explore?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
  const root = shell.replace(
    /<\/head>/,
    `  <script type="application/ld+json">\n${JSON.stringify(orgLd, null, 2)}\n  </script>\n</head>`,
  )
  await writeFile(join(OUT, 'index.html'), root, 'utf8')

  console.log(`[prerender] wrote ${written} store pages`)
}

main().catch((err) => {
  console.error('[prerender] failed:', err.message)
  // Exit 0: prerendering is an optimisation, and a build that produces a
  // working site without it is better than no deploy at all.
})
