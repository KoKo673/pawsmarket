import { ArrowLeft, Loader2, Radar, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ListingCard } from '@/components/explore/ListingCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNearbyListings } from '@/hooks/use-listings'

/**
 * «در همین حوالی» — نزدیک‌ترین ۶ آگهی داخل شعاع فعلی؛
 * کش React Query را با صفحه‌ی کاوش شریک است (جابه‌جایی بی‌درنگ).
 * حالت خطا: بک‌اند سخت‌گیرانه — پیام + «تلاش دوباره» بدون داده‌ی جایگزین.
 */
export function FeaturedNearby() {
  const { data, isLoading, isError, refetch, isFetching } = useNearbyListings()
  const listings = data?.slice(0, 6) ?? []

  return (
    <section data-motion-section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div data-motion-item className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            <Radar className="size-3.5" />
            داخل شعاع جستجوی شما
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">در همین حوالی</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">مرتب‌شده بر اساس فاصله از نقطه‌ی جستجوی شما</p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/explore">
            <ArrowLeft className="size-4" />
            مشاهده‌ی نقشه
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isError ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
              <WifiOff className="size-6" />
            </span>
            <p className="mt-4 text-sm font-extrabold">در حال حاضر به سرور وصل نیستیم</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              نتایج زنده از بک‌اند پازمارکت خوانده می‌شوند؛ تا زمان برقراری اتصال، داده‌ای نمایش داده نمی‌شود.
            </p>
            <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={() => refetch()} disabled={isFetching}>
              {isFetching && <Loader2 className="size-3.5 animate-spin" />}
              تلاش دوباره
            </Button>
          </div>
        ) : isLoading ? (
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          ))
        ) : (
          listings.map((item, i) => <ListingCard key={item.id} item={item} index={i} />)
        )}
        {/* کارت‌ها خودشان data-motion-item دارند (ListingCard) — بخش اینجا فقط
            به‌عنوان مرز راه‌انداز عمل می‌کند و استگر را DOM order می‌دهد */}
      </div>
    </section>
  )
}
