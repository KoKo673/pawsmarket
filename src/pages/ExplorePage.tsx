import { Heart, List, Loader2, Map as MapIcon, PawPrint, ServerCrash, SlidersHorizontal, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { FilterSheet, FilterSidebar } from '@/components/explore/FilterSidebar'
import { ListingCard } from '@/components/explore/ListingCard'
import { MapView } from '@/components/explore/MapView'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNearbyListings } from '@/hooks/use-listings'
import { faDigits } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { useFavoritesStore } from '@/store/favorites.store'
import { useFiltersStore } from '@/store/filters.store'
import { useGeoStore } from '@/store/geo.store'
import { useUiStore } from '@/store/ui.store'
import type { Filters } from '@/types'

/** لینک‌های عمیق فوتر/بروشور: /explore?preset=shelters و غیره */
const URL_PRESETS: Record<string, Partial<Filters>> = {
  dogs: { kinds: ['pet'], species: ['dog'] },
  cats: { kinds: ['pet'], species: ['cat'] },
  food: { kinds: ['product'], categories: ['food'] },
  vets: { kinds: ['store'], categories: ['vet'] },
  groomers: { kinds: ['store'], categories: ['groomer'] },
  // پناهگاه‌ها در حومه‌اند — شعاع ۳۰کیلومتر تا همه نمایان شوند
  shelters: { kinds: ['store'], categories: ['shelter'], radiusKm: 30 },
}

/**
 * قلب اپ — نمای تقسیم‌شده‌ی جغرافیایی.
 *
 * دسکتاپ (≥۱۰۲۴): [ ریل فیلترها | لیست کارت‌ها | نقشه‌ی زنده ]
 * موبایل: یک لایه با کلید شیشه‌ای شناور «لیست / نقشه»
 * (همان state در ui.store — mobileView).
 *
 * پنل‌ها با visibility جابه‌جا می‌شوند نه display:none تا نقشه همیشه
 * اندازه‌ی واقعی داشته باشد (Leaflet با کانتینر صفر NaN می‌شود).
 */
export function ExplorePage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useNearbyListings()
  const origin = useGeoStore((s) => s.origin)
  const radiusKm = useFiltersStore((s) => s.radiusKm)
  const favoritesOnly = useFiltersStore((s) => s.favoritesOnly)
  const setFavoritesOnly = useFiltersStore((s) => s.setFavoritesOnly)
  const applyPreset = useFiltersStore((s) => s.applyPreset)
  const favorites = useFavoritesStore((s) => s.ids)
  const [searchParams] = useSearchParams()

  // لینک‌های عمیق (?preset=vets&favorites=1) فقط یک‌بار هنگام ورود اعمال می‌شوند
  useEffect(() => {
    const preset = searchParams.get('preset')
    if (preset && URL_PRESETS[preset]) applyPreset(URL_PRESETS[preset])
    if (searchParams.get('favorites') === '1') setFavoritesOnly(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // مشتق‌سازی: حالت «فقط ذخیره‌شده‌ها» روی نتایج زنده اعمال می‌شود
  const listings = favoritesOnly ? (data ?? []).filter((l) => favorites.includes(l.id)) : (data ?? [])

  // رندر تدریجی — با ۲۰۰+ فروشگاه و ۷۰۰+ محصول، همه‌ی کارت‌ها یکجا
  // mount نمی‌شوند (کارت + تصویر + motion observer برای هر کدام سنگین است)
  const PAGE = 48
  const [visible, setVisible] = useState(PAGE)
  useEffect(() => {
    setVisible(PAGE)
  }, [listings.length, favoritesOnly])

  const mobileView = useUiStore((s) => s.mobileView)
  const setMobileView = useUiStore((s) => s.setMobileView)
  const setFilterDrawerOpen = useUiStore((s) => s.setFilterDrawerOpen)
  const openDetail = useUiStore((s) => s.openDetail)

  return (
    <div className="pt-16">
      {/*
        موبایل: هر دو پنل داخل یک استیج ثابت انباشته‌اند و با visibility
        تعویض می‌شوند. دسکتاپ: grid آن‌ها را کنار هم می‌چیند (lg:visible).
      */}
      <div className="relative h-[calc(100svh-4rem)] lg:grid lg:grid-cols-[19rem_minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ── ریل فیلتر دسکتاپ ── */}
        <FilterSidebar />

        {/* ── پنل لیست کارت‌ها ── */}
        <section
          className={cn(
            'absolute inset-0 min-w-0 flex-col overflow-y-auto border-border bg-background lg:static lg:flex lg:h-full lg:visible lg:border-r',
            mobileView === 'list' ? 'visible z-10 flex' : 'invisible z-0',
          )}
          aria-label="نتایج جستجو"
        >
          {/* سربرگ لیست */}
          <div className="sticky top-0 z-10 border-b border-border/70 bg-background/85 px-5 py-4 backdrop-blur-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-extrabold tracking-tight">کاوش در اطراف</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className={cn(isLoading && 'animate-pulse')}>
                    {isLoading
                      ? 'در حال جستجو…'
                      : isError
                        ? 'سرور پاسخی نداد'
                        : favoritesOnly
                          ? `${faDigits(listings.length)} مورد ذخیره‌شده`
                          : `${faDigits(listings.length)} نتیجه`}
                  </span>
                  {!favoritesOnly && (
                    <>
                      <span aria-hidden>·</span>
                      <span>در شعاع {faDigits(radiusKm)} کیلومتری</span>
                    </>
                  )}
                </p>
              </div>

              {/* دکمه‌ی فیلتر (فقط موبایل) */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 lg:hidden"
                onClick={() => setFilterDrawerOpen(true)}
              >
                <SlidersHorizontal className="size-4" />
                فیلترها
              </Button>
            </div>
          </div>

          {/* نتایج */}
          <div className="flex-1 px-5 pb-24 pt-5 lg:pb-5">
            {isError ? (
              /* حالت خطای سخت‌گیرانه — بک‌اند در دسترس نیست یا پاسخ خراب است */
              <div className="flex h-full min-h-72 flex-col items-center justify-center px-6 text-center">
                <span className="grid size-20 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <ServerCrash className="size-9" />
                </span>
                <h2 className="mt-5 text-lg font-extrabold">اتصال به سرور برقرار نشد</h2>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  پاسخی از بک‌اند پازمارکت (localhost:9232) نرسید. مطمئن شوید سرویس در حال اجراست و
                  سه مسیر <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/pets</code>،{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/products</code> و{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/stores/nearby</code>{' '}
                  پاسخ می‌دهند.
                </p>
                {error instanceof Error && (
                  <p className="ltr-inline mt-2 max-w-full truncate text-xs text-muted-foreground/70" title={error.message}>
                    {error.message}
                  </p>
                )}
                <Button className="mt-5" onClick={() => refetch()} disabled={isFetching}>
                  {isFetching ? <Loader2 className="size-4 animate-spin" /> : <WifiOff className="size-4" />}
                  تلاش دوباره
                </Button>
              </div>
            ) : isLoading ? (
              <div className="space-y-5">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="rounded-2xl bg-card p-4 shadow-soft">
                    <Skeleton className="aspect-[16/9] w-full rounded-xl" />
                    <Skeleton className="mt-3 h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3.5 w-1/2" />
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              /* حالت خالی */
              <div className="flex h-full min-h-72 flex-col items-center justify-center px-6 text-center">
                <span className="grid size-20 place-items-center rounded-full bg-muted">
                  {favoritesOnly ? (
                    <Heart className="size-9 text-muted-foreground/60" />
                  ) : (
                    <PawPrint className="size-9 text-muted-foreground/60" />
                  )}
                </span>
                {favoritesOnly ? (
                  <>
                    <h2 className="mt-5 text-lg font-extrabold">هنوز آگهی ذخیره نکرده‌اید</h2>
                    <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                      روی قلب هر کارت بزنید تا اینجا جمع شود — لیست روی دستگاه شما می‌ماند.
                    </p>
                    <Button className="mt-5" onClick={() => setFavoritesOnly(false)}>
                      مشاهده‌ی همه‌ی آگهی‌ها
                    </Button>
                  </>
                ) : (
                  <>
                    <h2 className="mt-5 text-lg font-extrabold">
                      در شعاع {faDigits(radiusKm)} کیلومتری چیزی پیدا نشد
                    </h2>
                    <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                      شعاع را بزرگ‌تر کنید یا یک فیلتر را بردارید — حتماً حیواناتی همین اطراف هستند.
                    </p>
                    <Button className="mt-5" onClick={() => setFilterDrawerOpen(true)}>
                      <SlidersHorizontal className="size-4" />
                      تغییر فیلترها
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div data-motion-section="group" className="grid gap-5 min-[1700px]:grid-cols-2">
                {listings.slice(0, visible).map((item, i) => (
                  <ListingCard key={item.id} item={item} index={i} />
                ))}
              </div>
            )}
            {listings.length > visible && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setVisible((v) => v + PAGE)}
                >
                  <List className="size-4" />
                  نمایش موارد بیشتر ({faDigits(listings.length - visible)} مورد دیگر)
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ── پنل نقشه ── */}
        <div
          className={cn(
            'absolute inset-0 lg:static lg:h-full lg:visible',
            mobileView === 'map' ? 'visible z-10' : 'invisible z-0',
          )}
          aria-label="نقشه"
        >
          <MapView listings={listings} origin={origin} onSelect={openDetail} />
        </div>
      </div>

      {/* ── کلید شناور لیست/نقشه (موبایل) ── */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-drawer flex justify-center lg:hidden">
        <Tabs
          value={mobileView}
          onValueChange={(v) => setMobileView(v as 'list' | 'map')}
          className="pointer-events-auto"
        >
          <TabsList className="glass h-12 gap-1 px-1.5 shadow-lifted">
            <TabsTrigger value="list" className="gap-1.5 px-5">
              <List className="size-4" />
              لیست
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-1.5 px-5">
              <MapIcon className="size-4" />
              نقشه
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* شیت فیلتر موبایل */}
      <FilterSheet />
    </div>
  )
}
