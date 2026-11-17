import { Loader2, Package, Search, ShoppingCart } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { RatingStars } from '@/components/shop/RatingStars'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { faDigits, faPrice } from '@/lib/fa'
import { shopApi, type ShopProduct } from '@/lib/shop-api'
import { useAuthStore } from '@/store/auth.store'

/**
 * فروشگاه — محصولاتی که خودمان می‌فروشیم.
 *
 * Everything here is priced by the sync job (cheapest source + a tiered
 * margin), so `price_toman` is our selling price, not a source's. When a
 * product has no image the card says so rather than showing a broken
 * frame: a missing image is normal, not an error.
 */
/** 24 is 6 rows of 4 on desktop and 12 of 2 on a phone — not 40, so the
 *  rest of the catalogue is reachable without a scroll that never ends. */
const PAGE = 24

export function ShopPage() {
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [page, setPage] = useState(0)

  // Measured 2026-11-17: the page header said «۷۹۷ محصول» while 51 cards
  // rendered. The API was paginated and correct; this component asked for
  // ONE page and never asked for another, so 94% of the catalogue existed
  // and could not be reached. The count came from `total`, which is why
  // the discrepancy was visible at all.
  const products = useQuery({
    queryKey: ['shop-products', submitted, page],
    queryFn: () => shopApi.products(submitted, PAGE, page * PAGE),
    // Keeps the previous page on screen while the next one loads, so the
    // grid does not collapse to a spinner and jump the scroll position.
    placeholderData: (prev) => prev,
  })

  const items = products.data?.items ?? []
  const total = products.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE))

  // Changing page must land the reader at the TOP of the new list.
  //
  // Measured 2026-11-17 by the owner: after tapping «صفحهٔ بعد» the next
  // products loaded but the viewport stayed at the pager, so the page
  // looked unchanged — the new content was above the fold and the only
  // thing visible was the same two buttons. `placeholderData` above keeps
  // the old grid mounted while the new one loads, which makes this worse
  // (nothing reflows, so nothing moves), and the comment there used to
  // claim the opposite.
  //
  // `scrollIntoView` on a ref, not `window.scrollTo(0,0)`: the grid is
  // inside a page that may be offset, and scrolling the document to zero
  // would also hide the header's context. The ref moves to the count line,
  // so the reader sees «… محصول · صفحهٔ N از M» and then the cards.
  const topRef = useRef<HTMLParagraphElement | null>(null)

  function goToPage(next: number) {
    const clamped = Math.max(0, Math.min(pageCount - 1, next))
    if (clamped === page) return
    setPage(clamped)
    // Smooth, but respect prefers-reduced-motion — for some people a
    // 600px animated jump is nausea, not polish.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    topRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth',
                                     block: 'start' })
  }

  // A new search starts at page 1: staying on page 5 of a two-page result
  // shows an empty grid that looks like "no products", not "wrong page".
  const submitSearch = () => {
    setSubmitted(q.trim())
    setPage(0)
    topRef.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6">
      <header className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Package className="size-3.5" />
          فروشگاه پازمارکت
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          محصولات حیوان خانگی
        </h1>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); submitSearch() }}
        className="mb-6 flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو در محصولات…"
            className="pe-9"
            aria-label="جستجوی محصول"
          />
        </div>
        <Button type="submit">جستجو</Button>
      </form>

      {products.isPending && (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {products.isError && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
          {products.error instanceof Error ? products.error.message : 'محصولات بارگذاری نشد'}
        </p>
      )}

      {!products.isPending && !products.isError && items.length === 0 && (
        <div className="rounded-3xl border border-border bg-muted/30 px-6 py-16 text-center">
          <Package className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">محصولی پیدا نشد</p>
          {submitted && (
            <button
              type="button"
              onClick={() => { setQ(''); setSubmitted(''); setPage(0) }}
              className="mt-2 text-sm font-bold text-primary underline"
            >
              پاک کردن جستجو
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <>
          <p ref={topRef} className="mb-4 scroll-mt-24 text-xs text-muted-foreground">
            {faDigits(total)} محصول
            {pageCount > 1 && <> · صفحهٔ {faDigits(page + 1)} از {faDigits(pageCount)}</>}
          </p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => <ProductCard key={p.id} product={p} />)}
          </ul>

          {pageCount > 1 && (
            <nav aria-label="صفحه‌های محصولات" className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                disabled={page === 0 || products.isFetching}
                onClick={() => goToPage(page - 1)}
              >
                صفحهٔ قبل
              </Button>
              {/* Numbers, not «1 2 3 … 34»: clicking is the use case, and an
                  ellipsis list is one more control to get wrong. The count
                  is the rarer fix, and it still shows in the page label. */}
              <span className="text-sm font-bold" aria-live="polite">
                {faDigits(page + 1)} / {faDigits(pageCount)}
              </span>
              <Button
                variant="outline"
                disabled={page + 1 >= pageCount || products.isFetching}
                onClick={() => goToPage(page + 1)}
              >
                صفحهٔ بعد
              </Button>
            </nav>
          )}
          {page + 1 >= pageCount && items.length > 0 && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              این آخرِ فروشگاه است
            </p>
          )}
        </>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: ShopProduct }) {
  const user = useAuthStore((s) => s.user)
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const href = useMemo(() => `/shop/${product.id}`, [product.id])

  async function add() {
    if (!user) return
    setBusy(true); setError(null)
    try {
      await shopApi.addToCart(product.id, 1)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'افزودن انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/*
        One link per card, not three.

        The image and the title both linked here, so tabbing through 40
        products took 120 stops to reach one card's button — measured with
        a keyboard-only walk. The image is now inside the title link with
        `tabIndex={-1}`, so the whole card is one stop and the image is
        still clickable for anyone using a mouse.
      */}
      <Link
        to={href}
        className="group/link block aspect-square overflow-hidden bg-muted/40"
        tabIndex={-1}
        aria-hidden="true"
      >
        {product.image ? (
          <img
            src={product.image}
            alt=""
            loading="lazy"
            className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="grid size-full place-items-center text-[11px] text-muted-foreground">
            بدون تصویر
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link to={href} className="line-clamp-2 text-sm font-bold leading-snug hover:text-primary">
          {product.name}
        </Link>
        {/* Above the price on purpose: the rating is what makes the price
            mean something. Absent when there is none — see RatingStars. */}
        {product.rating !== null && (
          <span className="mt-1.5">
            <RatingStars rating={product.rating} count={product.rating_count} />
          </span>
        )}

        <p className="mt-2 text-base font-extrabold text-primary">
          {faPrice(product.price_toman)}
        </p>

        {error && <p className="mt-1 text-[11px] text-destructive-text">{error}</p>}

        {user ? (
          <Button
            onClick={() => void add()}
            disabled={busy}
            size="sm"
            variant={added ? 'secondary' : 'default'}
            className="mt-3 w-full gap-1.5"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" />
              : added ? <Package className="size-3.5" />
              : <ShoppingCart className="size-3.5" />}
            {added ? 'افزوده شد' : 'افزودن به سبد'}
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline" className="mt-3 w-full">
            <Link to="/login?next=/shop">برای خرید وارد شوید</Link>
          </Button>
        )}
      </div>
    </li>
  )
}
