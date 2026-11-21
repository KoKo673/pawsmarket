/**
 * The URL rewriter that makes product images cost 5 KB instead of 30 KB.
 *
 * Three variants of this function shipped broken before this test existed,
 * and every one of them failed *silently* — the page still rendered, the
 * CDN still answered 200, it just answered with the wrong bytes. The stored
 * chains it has to handle are exactly these two, counted on production
 * 2026-11-21 out of 526 Digikala URLs:
 *
 *   image/resize,m_lfit,h_600,w_600/quality,q_90   478
 *   image/resize,m_lfit,h_300,w_300/quality,q_80    48
 *
 * Run with: npm test  (node --test, no dependencies)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  imageSrcSet, canResize, CARD_SIZES,
  isLocalImage, localImageSrcSet,
} from './img.ts'
import { LOCAL_IMAGE_VARIANTS } from './local-image-variants.ts'

const HOST = 'https://dkstatics-public.digikala.com/digikala-products/abc_123.jpg'
const STORED_600 = `${HOST}?x-oss-process=image/resize,m_lfit,h_600,w_600/quality,q_90`
const STORED_300 = `${HOST}?x-oss-process=image/resize,m_lfit,h_300,w_300/quality,q_80`

/** Pull the `x-oss-process` chain out of a URL for readable assertions. */
function chain(url: string): string {
  const at = url.indexOf('x-oss-process=')
  assert.notEqual(at, -1, `no chain in ${url}`)
  return url.slice(at + 'x-oss-process='.length)
}

test('the resize is replaced, not appended', () => {
  // Appending is silently ignored by the CDN: four different appended sizes
  // all came back as the same 13,354 bytes. So there must be exactly one
  // resize operation in the output.
  const out = chain(imageSrcSet(STORED_600)!.split(', ')[0])
  assert.equal(out.match(/resize,/g)?.length, 1, out)
})

test('the namespace is preserved — `image/` is not an operation', () => {
  const out = chain(imageSrcSet(STORED_600)!.split(', ')[0])
  assert.ok(out.startsWith('image/'), out)
  assert.ok(out.includes('image/resize,m_lfit'), out)
})

test('quality survives — dropping it makes the file BIGGER', () => {
  // q_90 is what keeps a 600px photo at 30 KB. Omitting it lets the CDN
  // pick a higher quality, and the "optimisation" ships more bytes than the
  // original. This was a real shipped bug.
  const out = chain(imageSrcSet(STORED_600)!.split(', ')[0])
  assert.ok(out.includes('/quality,q_90'), out)
})

test('a q_80 image keeps its own quality, not the other one', () => {
  const out = chain(imageSrcSet(STORED_300)!.split(', ')[0])
  assert.ok(out.includes('/quality,q_80'), out)
  assert.ok(!out.includes('q_90'), out)
})

test('format,webp survives — otherwise the CDN stops serving webp', () => {
  const webp = `${STORED_600}/format,webp`
  const out = chain(imageSrcSet(webp)!.split(', ')[0])
  assert.ok(out.includes('/format,webp'), out)
  assert.ok(out.includes('/quality,q_90'), out)
  assert.equal(out.match(/format,/g)?.length, 1, `webp added twice: ${out}`)
})

test('webp is requested even when the stored URL has no format op', () => {
  // Measured on a real card image at 200px: 14,232 B jpeg vs 7,816 B webp.
  // None of the 526 stored Digikala URLs asked for webp, so this is where
  // most of the saving actually comes from.
  const out = chain(imageSrcSet(STORED_600)!.split(', ')[0])
  assert.ok(out.includes('/format,webp'), out)
})

test('an existing avif or jpeg format op is respected, not overridden', () => {
  const avif = `${STORED_600}/format,avif`
  const out = chain(imageSrcSet(avif)!.split(', ')[0])
  assert.ok(out.includes('/format,avif'), out)
  assert.ok(!out.includes('format,webp'), out)
})

test('the ladder is 200/400/600 and every entry is a full URL', () => {
  const set = imageSrcSet(STORED_600)!
  const entries = set.split(', ')
  assert.equal(entries.length, 3)
  const widths = entries.map((e) => Number(e.match(/(\d+)w$/)![1]))
  assert.deepEqual(widths, [200, 400, 600])
  for (const e of entries) {
    assert.ok(e.startsWith('https://'), e)
    assert.ok(e.endsWith(`${widths[entries.indexOf(e)]}w`), e)
  }
})

test('a URL with no chain gets one, with its namespace', () => {
  // Omitting `image/` here makes the CDN reject the chain and serve the
  // untouched original — the optimisation silently does nothing.
  const out = chain(imageSrcSet(HOST)!.split(', ')[0])
  assert.ok(out.startsWith('image/'), out)
})

test('the query string before the chain is not lost', () => {
  const signed = `${HOST}?v=9&x-oss-process=image/resize,m_lfit,h_600,w_600/quality,q_90`
  const out = imageSrcSet(signed)!.split(', ')[0]
  assert.ok(out.includes('?v=9&'), out)
})

test('other operations are left alone', () => {
  const withMore = `${HOST}?x-oss-process=image/resize,m_lfit,h_600,w_600/quality,q_90/watermark,text_abc`
  const out = chain(imageSrcSet(withMore)!.split(', ')[0])
  assert.ok(out.includes('/watermark,text_abc'), out)
})

test('non-resizable hosts produce no srcset at all', () => {
  // Torob returns the same 189 KB JPEG for every variant. An empty srcset
  // makes the browser fall back to src; a srcset of one repeated URL makes
  // it download a redundant copy. Returning undefined avoids both.
  assert.equal(imageSrcSet('https://img.digikala.com/x.jpg'), undefined)
  assert.equal(imageSrcSet('https://dkstatics-public.digikala.com.evil.com/x.jpg'), undefined)
  assert.equal(imageSrcSet(null), undefined)
  assert.equal(imageSrcSet(undefined), undefined)
})

test('canResize is host-anchored, not substring', () => {
  assert.equal(canResize(STORED_600), true)
  assert.equal(canResize('https://dkstatics-public.digikala.com.evil.test/a.jpg'), false)
  assert.equal(canResize('https://example.com/dkstatics-public.digikala.com/a.jpg'), false)
})

/**
 * Resolve `sizes` the way a browser does: first matching entry wins, and the
 * last entry (no media condition) is the fallback. Only the shapes we
 * actually emit are evaluated — anything else throws rather than silently
 * resolving to a number the test would then assert against itself.
 */
function resolveSizes(sizes: string, vw: number): number {
  const evalCalc = (expr: string): number => {
    // Parens carry no meaning for the arithmetic we emit; dropping them makes
    // the pattern independent of how the caller nests `calc(...)`.
    const c = /^(\d+)vw\s*-\s*(\d+)px\s*(?:\/\s*(\d+))?$/.exec(expr.replace(/[()]/g, ' ').trim())
    if (!c) throw new Error(`unhandled calc: ${expr}`)
    const px = (vw * Number(c[1])) / 100 - Number(c[2])
    return c[3] ? px / Number(c[3]) : px
  }
  for (const entry of sizes.split(',').map((s) => s.trim())) {
    // Split "media query + value" only at the value, which is the last token.
    const mq = /^\(min-width:\s*\d+px\)\s*(.+)$/.exec(entry)
    if (mq) {
      const min = Number(/\(min-width:\s*(\d+)px\)/.exec(entry)![1])
      if (vw < min) continue
      const v = mq[1]
      return /^\d+px$/.test(v) ? Number(v.slice(0, -2)) : evalCalc(v.replace(/^calc/, ''))
    }
    return evalCalc(entry.replace(/^calc/, ''))
  }
  throw new Error(`no entry matched at ${vw}px`)
}

test('sizes does not under-declare the rendered card at any breakpoint', () => {
  // The rendered card, recomputed from the real grid in ShopPage.tsx:
  // `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4` (1rem) inside
  // `mx-auto max-w-6xl px-4 sm:px-6` — so the content column is
  // min(vw, 1152) minus 32 below 640 and minus 48 at and above it.
  const CARD = (vw: number) => {
    const inner = Math.min(vw, 1152) - (vw >= 640 ? 48 : 32)
    const cols = vw >= 1024 ? 4 : vw >= 640 ? 3 : 2
    return (inner - 16 * (cols - 1)) / cols
  }

  for (const vw of [320, 375, 414, 640, 700, 768, 900, 1024, 1100, 1152, 1280, 1536, 1920]) {
    const declared = resolveSizes(CARD_SIZES, vw)
    const rendered = CARD(vw)
    // Under-declaring is the bug that matters: the browser then fetches a
    // candidate smaller than the box and upscales it. 1px absorbs the
    // rounding in `calc(50vw - 24px)`.
    assert.ok(
      declared >= rendered - 1,
      `sizes under-declares at ${vw}px: says ${declared}, card is ${rendered}`,
    )
    assert.ok(
      declared <= rendered * 1.25,
      `sizes over-declares at ${vw}px: says ${declared}, card is ${rendered}`,
    )
  }
})

test('naturalWidth on a `w`-descriptor image is the density-corrected size', () => {
  // Not an assertion about our code — a trap that cost an hour of production
  // debugging on 2026-11-21, recorded so it is not re-investigated.
  //
  // With `w` descriptors the spec says `naturalWidth` must report the
  // image's intrinsic width DIVIDED BY the density the browser inferred
  // (`srcset w` ÷ `sizes`). So a genuine 600x600 file selected for a 164px
  // slot at DPR 3 reports `naturalWidth === 163`, and it looks exactly like
  // the CDN ignored the resize and served a thumbnail. It did not: the
  // response body was 27070 bytes of 600x600 webp, confirmed by decoding it.
  //
  // The check that actually answers "did the resize happen" is the decoded
  // file or `currentSrc`, never `naturalWidth`.
  const fileWidth = 600
  const inferredDensity = 3.67
  assert.equal(Math.round(fileWidth / inferredDensity), 163)
})

test('the ladder step the browser picks is never smaller than the box', () => {
  // What actually leaves the network is not the `sizes` number but the
  // srcset candidate chosen from it. 200/400/600 is the ladder in
  // imageSrcSet; a browser takes the smallest candidate at or above
  // `declared × DPR` and falls back to the largest when none is big enough.
  const LADDER = [200, 400, 600]
  const pick = (need: number) => LADDER.find((w) => w >= need) ?? LADDER[LADDER.length - 1]

  for (const [vw, card] of [
    [375, 163.5],
    [640, 186.67],
    [768, 229],
    [1024, 232],
    [1152, 264],
    [1920, 264],
  ] as const) {
    const declared = resolveSizes(CARD_SIZES, vw)
    assert.ok(Math.abs(declared - card) < 0.75, `at ${vw}px: ${declared} vs ${card}`)
    for (const dpr of [1, 2, 3]) {
      const need = card * dpr
      const chosen = pick(declared * dpr)
      // 600 is the stored original and therefore the top rung; past that the
      // browser can only upscale the best we have, so the ceiling is the
      // contract, not a shortfall.
      assert.ok(
        chosen >= Math.min(need, 600) - 1,
        `at ${vw}px dpr${dpr}: fetched ${chosen} for a ${need.toFixed(0)}px box`,
      )
    }
  }
})

test('a real phone never needs more than the ladder tops out at', () => {
  // The widest 3x phone viewport in common use is ~430 CSS px. At 2-up that
  // is a ~191px card, so its 3x demand is 573 — still under 600. This is why
  // 600 can be the ceiling without any phone upscaling, and it is the fact
  // to re-check before anyone shrinks the top rung.
  const widest3x = 430
  const card = (Math.min(widest3x, 1152) - 32 - 16) / 2
  const need = card * 3
  assert.ok(need <= 600, `a ${widest3x}px 3x phone needs ${need.toFixed(0)}px`)
})
test('a bundled image with variants gets a srcset naming only real rungs', () => {
  // 820px source: the converter writes w660 and refuses to upscale to 1024,
  // so a 1024 entry here would point at a file that does not exist and the
  // tile would render broken on a retina desktop.
  const one = localImageSrcSet('/images/listings/cat-orange.jpg')
  assert.equal(one, '/images/listings/cat-orange.w660.webp 660w')

  // A 1024px-wide source carries both rungs.
  const two = localImageSrcSet('/images/stores/generated/vet.jpg')
  if (two !== undefined) {
    assert.match(two, /\.w660\.webp 660w/)
    assert.match(two, /\.w1024\.webp 1024w/)
  }
})

test('a local image with no variants gets no srcset, not an empty one', () => {
  // An empty srcset makes some browsers ignore src entirely; `undefined`
  // makes the markup fall back to plain `src` with no attribute at all.
  assert.equal(localImageSrcSet('/images/listings/nope-not-converted.jpg'), undefined)
})

test('non-local and malformed URLs are left alone', () => {
  assert.equal(localImageSrcSet('https://dkstatics-public.digikala.com/x.jpg'), undefined)
  assert.equal(localImageSrcSet(undefined), undefined)
  assert.equal(localImageSrcSet(''), undefined)
  assert.equal(isLocalImage('/images/a.svg'), false)   // svg has no raster variant
  assert.equal(isLocalImage('/media/abc.jpg'), false)  // uploads, not bundled
})

test('the manifest never names a variant that is missing on disk', () => {
  // The generated manifest is the contract between the converter and the
  // frontend. A srcset naming a file that is not there is a broken tile on
  // exactly the devices with the most pixels, so check the files exist.
  const root = new URL('../../public/', import.meta.url)
  let checked = 0
  for (const [url, widths] of Object.entries(LOCAL_IMAGE_VARIANTS)) {
    const stem = url.replace(/\.jpg$/i, '')
    for (const w of widths) {
      const file = new URL('.' + stem + `.w${w}.webp`, root)
      assert.ok(
        existsSync(fileURLToPath(file)),
        `manifest names a missing variant: ${stem}.w${w}.webp`,
      )
      checked++
    }
  }
  assert.ok(checked > 0, 'manifest was empty')
})

test('a base-prefixed path resolves through the manifest too', () => {
  // The published build serves under /pawsmarket/, so callers pass an
  // `asset()`-built src. The lookup must find the same entry.
  assert.equal(
    localImageSrcSet('/pawsmarket/images/listings/cat-orange.jpg'),
    '/pawsmarket/images/listings/cat-orange.w660.webp 660w',
  )
})
