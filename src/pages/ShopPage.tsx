import { Loader2, Package, Search, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { faPrice } from '@/lib/fa'
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
export function ShopPage() {
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')

  const products = useQuery({
    queryKey: ['shop-products', submitted],
    queryFn: () => shopApi.products(submitted),
  })

  const items = products.data?.items ?? []
  const total = products.data?.total ?? 0

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
        onSubmit={(e) => { e.preventDefault(); setSubmitted(q.trim()) }}
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
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
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
              onClick={() => { setQ(''); setSubmitted('') }}
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
            {total} محصول
          </p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => <ProductCard key={p.id} product={p} />)}
          </ul>
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
        <p className="mt-2 text-base font-extrabold text-primary">
          {faPrice(product.price_toman)}
        </p>

        {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}

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
