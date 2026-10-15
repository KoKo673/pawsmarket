import { ChevronDown, ChevronLeft, Loader2, ShoppingBasket } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { ListingCard } from '@/components/explore/ListingCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNearbyListings } from '@/hooks/use-listings'
import { faDigits } from '@/lib/fa'

/**
 * «پیشنهاد محصولات» — شبکه‌ی معمولی محصولات با دکمه‌ی «بیشتر».
 *
 * The first version was a horizontal rail whose «بیشتر» appended another row
 * of cards off the right edge, so pressing it produced no visible change at
 * all: the new items were already outside the viewport and the page never
 * moved. The button now grows the list DOWNWARD in the ordinary document flow
 * and scrolls the first new row into view, so the press has a visible result.
 */
const STEP = 8

export function ProductRail() {
  const { data, isLoading, isError } = useNearbyListings()
  const [extra, setExtra] = useState(0)
  const gridRef = useRef<HTMLUListElement | null>(null)
  const prevCount = useRef(STEP)

  const products = useMemo(
    () => (data ?? []).filter((l) => l.kind === 'product'),
    [data],
  )
  const shown = products.slice(0, STEP + extra)
  const remaining = products.length - shown.length

  // Bring the first newly-added card into view, so pressing «بیشتر» reads as
  // "here is the next row" rather than as a button that did nothing.
  useEffect(() => {
    if (shown.length > prevCount.current && gridRef.current) {
      const next = gridRef.current.children[prevCount.current] as
        | HTMLElement
        | undefined
      next?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    prevCount.current = shown.length
  }, [shown.length])

  if (isError || (!isLoading && products.length === 0)) return null

  return (
    <section data-motion-section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div data-motion-item className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {/* tide-800 for the same reason as the booking badges: tide-600 on
              its own 10% wash is 2.94:1. Dark theme already cleared AA at
              tide-400, so only the light shade moves. */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tide-500/10 px-3 py-1 text-xs font-bold text-tide-800 dark:text-tide-400">
            <ShoppingBasket className="size-3.5" />
            خرید از فروشگاه‌های محدوده
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            کالاهای موجود
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isLoading
              ? 'در حال بارگذاری کالاها…'
              : `${faDigits(products.length)} کالا با قیمت روز و موجودی`}
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/explore?preset=food">
            <ChevronLeft className="size-4" />
            مشاهده‌ی همه‌ی کالاها
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[240px] shrink-0 space-y-3 rounded-2xl">
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* شبکه‌ی عمودی: هر «بیشتر» یک ردیف واقعی به پایین اضافه می‌کند و
              صفحه همان‌جا اسکرول می‌شود — برخلاف ریل افقی قبلی که آیتم‌های
              تازه بیرون از دید می‌افتادند و دکمه بی‌اثر به‌نظر می‌رسید. */}
          <ul
            ref={gridRef}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {shown.map((item, i) => (
              <li key={item.id}>
                <ListingCard item={item} index={i} />
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
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                بیشتر
                <ChevronDown className="size-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                {faDigits(remaining)} کالای دیگر در این دسته
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}