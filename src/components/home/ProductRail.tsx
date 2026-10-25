import { ChevronDown, ChevronLeft, ShoppingBasket } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { faDigits } from '@/lib/fa'
import { shopApi, type ShopProduct } from '@/lib/shop-api'

/**
 * «کالاهای موجود» — محصولات واقعی فروشگاه.
 *
 * This rail used to read `useNearbyListings()`, which by design returns
 * `products: []`: the catalogue snapshot is a scrape of other shops'
 * inventory and this marketplace sells only its own stock. So the filter
 * `l.kind === 'product'` could never match, the guard below returned null
 * on every load, and **the section never rendered at all** — while 251 real
 * products sat in `marketplace_products` behind `/api/shop/products`.
 *
 * Measured on the live page: four `<section>` elements, and neither this
 * rail nor the adoption rail among them.
 *
 * It now reads the shop API, which is the endpoint that actually has the
 * stock, and draws its own card rather than reusing `ListingCard` — that
 * component renders pets and shops (distance, species, adoptable) and has
 * no shape for a product with a price and a source.
 */
const STEP = 8

export function ProductRail() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home-products'],
    queryFn: () => shopApi.products('', 40),
  })

  const [extra, setExtra] = useState(0)
  const gridRef = useRef<HTMLUListElement | null>(null)
  const prevShown = useRef(0)

  const products = data?.items ?? []
  const shown = products.slice(0, STEP + extra)
  const remaining = products.length - shown.length

  // Bring the first newly-added row into view, so pressing «بیشتر» reads as
  // "here is the next row" rather than as a button that did nothing. The
  // `> 0` guard is what keeps the initial load from scrolling the page.
  useEffect(() => {
    if (prevShown.current > 0 && shown.length > prevShown.current && gridRef.current) {
      const next = gridRef.current.children[prevShown.current] as HTMLElement | undefined
      next?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    prevShown.current = shown.length
  }, [shown.length])

  if (isError || (!isLoading && products.length === 0)) return null

  return (
    <section data-motion-section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div data-motion-item className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tide-500/10 px-3 py-1 text-xs font-bold text-tide-800 dark:text-tide-400">
            <ShoppingBasket className="size-3.5" />
            موجودی خود پازمارکت
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            کالاهای موجود
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isLoading
              ? 'در حال بارگذاری کالاها…'
              : `${faDigits(data?.total ?? products.length)} کالا با قیمت روز`}
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/shop">
            <ChevronLeft className="size-4" />
            مشاهده‌ی همه‌ی کالاها
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <ul
            ref={gridRef}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {shown.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>

          {remaining > 0 && (
            <div className="mt-7 flex flex-col items-center gap-1.5">
              <Button
                variant="outline"
                className="gap-2 px-8"
                onClick={() => setExtra((e) => e + STEP)}
              >
                بیشتر
                <ChevronDown className="size-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                {faDigits(remaining)} کالای دیگر
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}

/**
 * یک کالا — تصویر مربع، نام دو خط، قیمت.
 *
 * Square frame, not 4:3: supplier pack shots are square and a wide box left
 * empty margins on both sides of every item. `object-contain` on a soft
 * ground keeps the whole pack visible — cropping a bag of food to its middle
 * band loses the label a shopper is matching against.
 */
function ProductCard({ product }: { product: ShopProduct }) {
  const price = new Intl.NumberFormat('fa-IR').format(product.price_toman)

  return (
    <Link
      to={`/shop/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl
        border border-border/60 bg-card shadow-soft transition-all duration-300
        hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lifted
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/40">
        {product.image ? (
          <img
            src={product.image}
            alt=""
            loading="lazy"
            className="size-full object-contain p-2 transition-transform duration-500
              group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-3xl opacity-40" aria-hidden="true">
            🐾
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-sm font-bold leading-snug">{product.name}</p>
        <p className="mt-auto text-sm font-extrabold tabular-nums text-primary">
          {price}
          <span className="ms-1 text-[11px] font-medium text-muted-foreground">تومان</span>
        </p>
      </div>
    </Link>
  )
}
