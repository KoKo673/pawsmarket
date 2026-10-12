import { ChevronLeft, Loader2, ShoppingBasket } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ListingCard } from '@/components/explore/ListingCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNearbyListings } from '@/hooks/use-listings'
import { faDigits } from '@/lib/fa'

/**
 * «پیشنهاد محصولات» — یک ریل افقی از کالاهای موجود در شعاع فعلی، با دکمه‌ی
 * «بیشتر» که دسته‌ی بعدی را به انتهای ریل اضافه می‌کند.
 *
 * چرا ریل و نه شبکه: کارت محصول در عرض ۲۱۰px جا می‌شود و در شبکه‌ی دو
 * ستونه جای زیادی خالی می‌ماند؛ ریل افقی هم با عادت آشنای اسکرول افقی
 * موبایل جور است و هم فروشگاه‌ها را بالای صفحه نشان می‌دهد.
 *
 * «بیشتر» به‌جای رفتن به صفحه‌ی جدا، همان‌جا لیست را بلندتر می‌کند — کاربر
 * وسط یک ویدئو یا اسکرول نیست و می‌خواهد همین‌جا ببیند چه چیز دیگری هست.
 */
const STEP = 8

export function ProductRail() {
  const { data, isLoading, isError } = useNearbyListings()
  const [extra, setExtra] = useState(0)

  const products = useMemo(
    () => (data ?? []).filter((l) => l.kind === 'product'),
    [data],
  )
  const shown = products.slice(0, STEP + extra)
  const remaining = products.length - shown.length

  if (isError || (!isLoading && products.length === 0)) return null

  return (
    <section data-motion-section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div data-motion-item className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tide-500/10 px-3 py-1 text-xs font-bold text-tide-600 dark:text-tide-400">
            <ShoppingBasket className="size-3.5" />
            موجود در اطراف شما
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            پیشنهاد محصولات
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isLoading
              ? 'در حال پیدا کردن کالاها…'
              : `${faDigits(products.length)} کالا با قیمت و موجودی واقعی`}
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/explore?preset=food">
            <ChevronLeft className="size-4" />
            همه‌ی محصولات
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
          {/* اسکرول افقی؛ در دسکتاپ همه‌ی کارت‌ها در یک ردیف جا می‌شوند */}
          <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
            {shown.map((item, i) => (
              <li
                key={item.id}
                className="w-[240px] shrink-0 snap-start sm:w-[260px]"
              >
                <ListingCard item={item} index={i} />
              </li>
            ))}
          </ul>

          {remaining > 0 && (
            <div className="mt-2 flex flex-col items-center gap-1">
              <Button
                variant="outline"
                className="gap-2 px-6"
                onClick={() => setExtra((e) => e + STEP)}
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                بیشتر
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