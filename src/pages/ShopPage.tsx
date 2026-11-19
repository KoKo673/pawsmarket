import { Loader2, Package, Search, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  const [sort, setSort] = useState('newest')
  const [category, setCategory] = useState('')

  // Chip row from the catalogue's own naming, not a hardcoded taxonomy.
  // A hand-written list rots the day a new product type arrives, and lies
  // for every product filed under the wrong heading.
  const cats = useQuery({
    queryKey: ['shop-categories'],
    queryFn: () => shopApi.categories(),
    staleTime: 10 * 60_000,
  })

  // Measured 2026-11-17: the page header said «۷۹۷ محصول» while 51 cards
  // rendered. The API was paginated and correct; this component asked for
  // ONE page and never asked for another, so 94% of the catalogue existed
  // and could not be reached. The count came from `total`, which is why
  // the discrepancy was visible at all.
  const products = useQuery({
    queryKey: ['shop-products', submitted, page, sort, category],
    queryFn: () => shopApi.products(submitted, PAGE, page * PAGE, sort, category),
    // Keeps the previous page on screen while the next one loads, so the
    // grid does not collapse to a spinner and jump the scroll position.
    placeholderData: (prev) => prev,
  })

  const items = products.data?.items ?? []
  const total = products.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE))

  // Changing page must land the reader at the TOP of the page.
  //
  // Two attempts failed before this one, and both failures were mine:
  //
  //   1. No scroll at all — the viewport stayed at the pager, so the new
  //      products appeared above the fold and the only thing visible was
  //      the same two buttons.
  //   2. `scrollIntoView` on the count line. Measured in a browser it
  //      landed at scrollY 292 on a phone: the count line sits at y≈96 and
  //      the title and search box are gone. That is "the middle of the
  //      page", not "بالا" — and I reported it fixed because I asserted
  //      "a card is on screen", which 292 satisfies.
  //
  // So: scroll the document to 0. The header (`محصولات حیوان خانگی`, the
  // search field, the chips) is what tells the reader the list changed;
  // the count line alone does not. `topRef` is gone with the approach.
  function goToPage(next: number) {
    const clamped = Math.max(0, Math.min(pageCount - 1, next))
    if (clamped === page) return
    setPage(clamped)
    scrollToTop()
  }

  // Smooth, but respect prefers-reduced-motion — for some people a 4 000px
  // animated jump is nausea, not polish.
  //
  // Called on the NEXT frame, not inline with setState: React commits the
  // new page asynchronously, and while the old grid is still mounted
  // (placeholderData) the document is at its previous height. Scrolling
  // inside the same tick as the click races that commit; deferring one
  // frame puts the scroll after it. This is why the earlier version needed
  // no such care and still lost the race on slower devices.
  function scrollToTop() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'smooth' }),
    )
  }

  // A new search starts at page 1: staying on page 5 of a two-page result
  // shows an empty grid that looks like "no products", not "wrong page".
  const submitSearch = () => {
    setSubmitted(q.trim())
    setPage(0)
    scrollToTop()
  }

  /** Changing a filter is a new result set, so it also resets to page 1 —
   *  page 5 of a two-page result shows an empty grid that reads as
   *  "no products". */
  function pickCategory(next: string) {
    setCategory(next)
    setPage(0)
    scrollToTop()
  }

  function pickSort(next: string) {
    setSort(next)
    setPage(0)
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

      {/* ── دسته‌ها و مرتب‌سازی ──────────────────────────────────────
          The two controls a storefront of 800 products cannot work
          without: which part of the catalogue am I looking at, and in what
          order. Chips come from the catalogue's own naming (measured:
          20 categories with >= 8 products); sort is a whitelist on the
          server, never a raw SQL fragment.

          The chip row scrolls horizontally on a phone rather than
          wrapping into four rows of chips above the products — the header
          is already three blocks tall and the products must stay visible. */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => pickCategory('')}
            aria-pressed={category === ''}
            className={
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ' +
              (category === ''
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card hover:bg-muted')
            }
          >
            همه
          </button>
          {(cats.data?.items ?? []).map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => pickCategory(c.name)}
              aria-pressed={category === c.name}
              className={
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ' +
                (category === c.name
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card hover:bg-muted')
              }
            >
              {c.name}
            </button>
          ))}
        </div>

        <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          مرتب‌سازی
          <select
            value={sort}
            onChange={(e) => pickSort(e.target.value)}
            className="rounded-xl border border-border bg-card px-2 py-1.5 text-xs font-bold text-foreground"
          >
            <option value="newest">جدیدترین</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
            {/* Only offered because a rating exists for part of the
                catalogue; the server sorts NULLS LAST so unrated products
                never outrank rated ones. */}
            <option value="rating">بیشترین امتیاز</option>
            <option value="popular">پرفروش‌ترین</option>
          </select>
        </label>
      </div>

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
          <p className="mb-4 text-xs text-muted-foreground">
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

      {/* «دکمه‌ها تراز نیست» (owner, 2026-11-19) — stars were only half the
          cause. Measured on a 375px phone, two cards in one row: heights
          identical at 328px, yet buttons at y=502 and y=521, because one name
          wraps to two lines and the other does not. A CSS grid stretches both
          CELLS to the same height; nothing inside them was obliged to line up.

          Two mechanisms, because each covers what the other misses:
            · reserved boxes for the variable slots above — the name always
              takes two lines, the rating always one, so the TOP of the card is
              the same height in every card;
            · `flex-1` on this column plus `mt-auto` on the block below, which
              pins price/error/button to the bottom as ONE unit. That is what
              makes the button position depend only on the cell height the grid
              already equalised — so even content I did not think to reserve
              (a price long enough to wrap, an error line) cannot move it.

          Reserving alone would be fragile: it only holds for the cases I
          enumerated. Bottom-anchoring holds for every case, including ones
          nobody has seen yet. */}
      <div className="flex flex-1 flex-col p-3">
        <Link to={href} className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug hover:text-primary">
          {product.name}
        </Link>
        {/* The slot is ALWAYS rendered; only its contents are conditional.
            Reporting this as a bug by the owner (2026-11-19): on a phone two
            cards share a row, the starred one grows by a line, CSS grid
            stretches both cells to the taller, and because the button hangs
            off `mt-auto` it lands at a different y in each — «با دیگر آیتم‌ها
            تراز نیست». Reserving the height means a card's geometry cannot
            depend on whether a rating happens to exist.

            Above the price on purpose: the rating is what makes the price
            mean something. Empty when there is none — see RatingStars. */}
        <div className="flex min-h-[18px] items-center">
          <RatingStars rating={product.rating} count={product.rating_count} />
        </div>

        {/* `mt-auto`, not `mt-1.5`: the price is the last thing before the
            button, so anchoring IT to the bottom anchors the button too.
            Without this, a short name leaves the price mid-card and the
            button floats — the exact misalignment in the owner's screenshot. */}
        <p className="mt-auto pt-1.5 text-base font-extrabold text-primary">
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
