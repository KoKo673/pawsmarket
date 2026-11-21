/**
 * Product-image URLs at the size the page will actually draw.
 *
 * ── The measurement this exists for (2026-11-21) ────────────────────
 * A shop card renders its photo at 162x162 on a 375px phone, but the API
 * stores a Digikala URL with `x-oss-process=image/resize,m_lfit,h_600,w_600`
 * baked into it — ~600x600 of pixels for a 162px box, 9.4x more bytes than
 * needed. Measured on one image, changing only that chain:
 *
 *   w=600  30 KB     w=400  16 KB     w=300  10 KB     w=200  5 KB
 *
 * 526 of 926 stored images are Digikala and all 526 carry that chain.
 *
 * ── Why rewrite instead of append ───────────────────────────────────
 * `x-oss-process` is an OFFSET-BASED mini-language, parsed left to right.
 * Appending a second `image/resize,...` after the existing one is silently
 * ignored — measured: four different appended sizes all returned the same
 * 13,354 bytes. The chain has to be REPLACED from `image/resize` onward.
 * Getting this wrong fails silently as "the optimisation did nothing", so
 * the rewrite is anchored on the first `image/` operation, not on the whole
 * query string.
 *
 * ── Torob cannot be resized ─────────────────────────────────────────
 * 400 of the 926 are Torob, whose CDN ignores `w=`, `width=`, `size=`,
 * `x-oss-process` and a `webp` Accept header — it returns the same 189 KB
 * JPEG for every variant. Nothing client-side can shrink it. It is still
 * worth converting the Digikala half: on a page of mixed cards that is the
 * difference between ~20 KB and ~200 KB per Digikala tile.
 *
 * ── Widths are the RENDERED box, not a guess ────────────────────────
 * Cards are 2-up on a phone and 4-up on desktop inside `max-w-6xl`, so the
 * rendered width is ~162px on a phone and ~276px on a wide screen. The
 * ladder below covers 1x and 2x of both. Picking one fixed size would either
 * blur on a retina phone or waste bytes on a desktop.
 */

/** Digikala's CDN. Only these URLs can be resized. */
const DIGIKALA = /^https:\/\/dkstatics-public\.digikala\.com\//

/**
 * Swap the resize block of a Digikala URL for one of the given width.
 *
 * Anything before `x-oss-process=` and anything after the resize operations
 * (like `format,webp`) is preserved; only `image/resize...` .. up to the next
 * `image/` or the end is replaced. If the URL has no chain at all, one is
 * added, which is correct for Digikala and harmless for anything else that
 * happens to match the host.
 */
function digikalaAt(url: string, width: number): string {
  const q = url.indexOf('?')
  const base = q === -1 ? url : url.slice(0, q)
  const query = q === -1 ? '' : url.slice(q + 1)
  // `resize` carries no namespace; it is prepended once, below, from the
  // URL's own namespace so a non-`image` chain is not silently mangled.
  const resize = `resize,m_lfit,h_${width},w_${width}`

  const marker = 'x-oss-process='
  const at = query.indexOf(marker)
  if (at === -1) {
    // `image` is the namespace every real Digikala chain carries; omitting it
    // makes the CDN reject the chain and serve the untouched original.
    return `${base}?x-oss-process=image/${resize}`
  }
  const head = query.slice(0, at + marker.length)
  const tail = query.slice(at + marker.length)

  // An x-oss chain is `NAMESPACE / op , param , param / op , param ...`:
  //
  //   image / resize,m_lfit,h_600,w_600 / quality,q_90
  //   └ns─┘   └────── operation 1 ─────┘ └─ operation 2 ─┘
  //
  // `image` is the namespace, not an operation, so splitting on '/' yields
  // ['image', 'resize,...', 'quality,...'] and every token AFTER the first
  // is an operation. Two attempts got this wrong before this one, both
  // silently:
  //
  //   · replacing `image/resize[^/]*` left `/quality,q_90` behind, giving a
  //     chain with TWO quality operations;
  //   · replacing `image/resize[^/]*` + `[^/]+` swallowed `format,webp`,
  //     which would have stopped serving webp on those images.
  //
  // Both were caught by printing the output for real stored URLs, which is
  // why that test exists.
  const parts = tail.split('/').filter(Boolean)
  const namespace = parts[0] || 'image'
  // Only the old `resize` is dropped — it is the one being replaced. Every
  // other operation survives, and `quality` matters: dropping it lets the
  // CDN pick a higher quality, so the "optimisation" ships MORE bytes than
  // the original. Both mistakes were shipped once before this test existed.
  const ops = parts.slice(1).filter((op) => !/^resize,/i.test(op))
  // `format,webp` is added, not merely preserved. Measured on a real card
  // image at 200px: 14,232 B jpeg → 7,816 B webp, and the CDN returns webp
  // on `Accept: image/*` (every browser sends it). Browser support for webp
  // is universal today, and a client that cannot decode it would fall back
  // to `src`, which is the same URL — so the worst case is the status quo.
  const hasFormat = ops.some((op) => /^format,/i.test(op))
  const allOps = hasFormat ? ops : [...ops, 'format,webp']
  return `${base}?${head}${namespace}/${resize}${allOps.length ? '/' + allOps.join('/') : ''}`
}

/** True when this host serves transformed images at all. */
export function canResize(url: string | null | undefined): boolean {
  return !!url && DIGIKALA.test(url)
}

/**
 * A srcset for product images, or `undefined` for hosts that cannot resize.
 *
 * `undefined` matters: an empty srcset makes the browser fall back to `src`,
 * but a srcset containing one identical URL for every descriptor makes it
 * download a redundant variant. Callers spread this, so nothing is emitted
 * when there is nothing to choose between.
 */
export function imageSrcSet(url: string | null | undefined): string | undefined {
  if (!canResize(url)) return undefined
  const src = url as string
  // 200 covers a 162px card at 1.25x; 400 covers it at 2x+; 600 is the
  // stored original and stays as the top of the ladder so a very high DPR
  // phone never upscales a smaller source.
  return [200, 400, 600].map((w) => `${digikalaAt(src, w)} ${w}w`).join(', ')
}

/**
 * The `sizes` attribute for the shop / rail grids: `grid-cols-2 sm:grid-cols-3
 * lg:grid-cols-4` with `gap-4` inside `max-w-6xl px-4 sm:px-6`.
 *
 * Derived from the grid, not sampled at breakpoints. The card width is a
* continuous function of the viewport inside each band, so a fixed number
* per breakpoint is wrong everywhere except the exact pixel it was measured
* at — the first version of this constant said `187px` for 640px and kept
* saying it all the way to 767, where the card is already 229. Every card in
* that band was therefore served a ladder step below its real size.
*
* Bands (`gap-4` = 16px between cards):
*   < 640       2 cols, px-4 (32)   → (100vw - 48) / 2
*   640–1023    3 cols, px-6 (48)   → (100vw - 80) / 3
*   1024–1151   4 cols, px-6 (48)   → (100vw - 96) / 4
*   ≥ 1152      4 cols, capped by `max-w-6xl` → 264
*
* 1152 is the only fixed stop: it is `max-w-6xl` itself, and `px-6` is part
* of the border box, so past it the content column is pinned at 1104px and
* the card genuinely stops growing.
 */
export const CARD_SIZES =
  '(min-width: 1152px) 264px, (min-width: 1024px) calc((100vw - 96px) / 4), (min-width: 640px) calc((100vw - 80px) / 3), calc(50vw - 24px)'

/** `sizes` for the product detail gallery, which is about half the viewport. */
export const DETAIL_SIZES = '(min-width: 768px) 420px, calc(100vw - 32px)'

/**
 * Intrinsic dimensions. The card box is a fixed aspect-square, so declaring
 * them costs nothing and lets the browser reserve space before the bytes
 * arrive — the difference between a grid that settles and one that jumps as
 * each image lands.
 */
export const CARD_IMG = { width: 600, height: 600 } as const