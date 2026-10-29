import { Bone, CalendarDays, MapPin, Navigation, PawPrint, Phone, ShieldCheck, Store } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { ImageGallery } from '@/components/detail/ImageGallery'
import { StatsGrid } from '@/components/detail/StatsGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BOOKING_ENABLED, isBookableCategory } from '@/lib/booking-rules'
import { faDecimal, faDigits, faPrice, faTimeRange } from '@/lib/fa'
import { formatDistance } from '@/lib/geo'
import { useNearbyListings } from '@/hooks/use-listings'
import { useUiStore } from '@/store/ui.store'
import type { ListingWithDistance } from '@/types'

const KIND_BADGE = {
  pet: { label: 'حیوان', icon: PawPrint },
  product: { label: 'محصول', icon: Bone },
  store: { label: 'فروشگاه', icon: Store },
} as const

/* دسته‌های نوبت‌پذیر و کلید خاموش‌بودن در `lib/booking-rules` است، نه اینجا:
   صفحهٔ نوبت هم همان دو را می‌خواند و اگر دو نسخه داشته باشند از هم دور
   می‌افتند — که دقیقاً همان اتفاقی بود که افتاد. */

/**
 * برگه‌ی جزئیات جهانی — با باز شدن هر کارت/پین باز می‌شود.
 * دسکتاپ: کارت شناور وسط‌چین؛ موبایل: شیت پایینی (Dialog).
 */
export function DetailModal() {
  const selectedId = useUiStore((s) => s.selectedId)
  const closeDetail = useUiStore((s) => s.closeDetail)
  const openDetail = useUiStore((s) => s.openDetail)
  const { data } = useNearbyListings()
  const { pathname } = useLocation()

  // تغییر مسیر = بسته شدن خودکار برگه (حالت نباید از بافت خودش جا بماند)
  useEffect(() => {
    closeDetail()
  }, [pathname, closeDetail])

  // Strict mode: only live backend results can open the detail sheet
  const item: ListingWithDistance | undefined = data?.find((l) => l.id === selectedId)

  const open = Boolean(selectedId) && Boolean(item)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDetail()}>
      {item && (
        <DialogContent className="max-w-3xl gap-5">
          {/* گالری — محصول‌ها عکس بسته‌بندی دارند و نباید بریده شوند */}
          <ImageGallery
            images={item.images}
            alt={item.name}
            fit={item.kind === 'product' ? 'contain' : 'cover'}
          />

          {/* سربرگ */}
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const meta = KIND_BADGE[item.kind]
                const Icon = meta.icon
                return (
                  <Badge variant="secondary" className="gap-1.5">
                    <Icon className="size-3" />
                    {meta.label}
                  </Badge>
                )
              })()}
              <Badge variant="outline" className="gap-1.5">
                <MapPin className="size-3 text-primary" />
                {formatDistance(item.distanceKm)} با شما
              </Badge>
              {item.kind === 'product' && !item.inStock && <Badge variant="destructive">ناموجود</Badge>}
              {item.kind === 'pet' && item.adoptable && <Badge variant="accent">قابل سرپرستی</Badge>}
            </div>
            <DialogTitle className="pt-1 text-2xl">{item.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 text-sm">
              <MapPin className="size-3.5 shrink-0" />
              {item.address}
              {item.kind === 'store' && (
                <>
                  <span aria-hidden>·</span>
                  <span className="font-semibold text-foreground">
                    {faDecimal(item.rating)} ★ ({faDigits(item.reviewCount)} نظر)
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* آمار کلیدی */}
          <StatsGrid item={item} />

          {/* توضیحات — carried on the listing itself since migration 0020 put
              the description in the database; the per-name lookup into
              shops-detail.ts is gone with that file. */}
          <div>
            <h4 className="text-sm font-extrabold">درباره</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>

          {/* نوار اعتماد */}
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div className="min-w-0 text-sm leading-snug">
              <p className="font-bold">
                {item.kind === 'pet'
                  ? item.ownerName
                    ? `ثبت‌کننده: ${item.ownerName}`
                    : 'ثبت‌کننده‌ای ثبت نشده است'
                  : item.kind === 'product'
                    ? `فروشنده: ${item.storeName}`
                    : item.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.kind === 'store'
                  ? `ساعات کار: ${faTimeRange(item.opensAt, item.closesAt)} · ${item.address}`
                  : 'تاییدشده در پازمارکت · معمولاً کمتر از ۲ ساعت پاسخ می‌دهد'}
              </p>
            </div>
          </div>

          {/* ── CTA شناور پایین ──
              موبایل: ستونی (قیمت بالا، دکمه‌ی تمام‌عرض پایین) تا با
              فونت بزرگ‌شده‌ی اندروید یا متن بلند هرگز سرریز/له‌شده نشود.
              دسکتاپ (sm+): همان ردیف قیمت + دکمه‌ها. */}
          <div className="sticky -bottom-6 -mx-6 -mb-6 flex flex-col gap-3 border-t border-border bg-card/95 px-6 py-4 backdrop-blur pb-safe sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              {item.kind !== 'store' && (
                <p className="text-xl font-extrabold text-primary">
                  {item.price === 0 ? 'رایگان' : faPrice(item.price)}
                </p>
              )}
              <p className="text-xs font-medium text-muted-foreground">{formatDistance(item.distanceKm)} با شما</p>
            </div>

            <div className="flex w-full min-w-0 gap-2 sm:w-auto sm:shrink-0">
              {item.kind === 'store' ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 sm:flex-none"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${item.location.lat},${item.location.lng}`,
                        '_blank',
                        'noopener',
                      )
                    }
                  >
                    <Navigation className="size-4" />
                    مسیریابی
                  </Button>
                  {/* نوبت‌گیری فقط برای مراکز خدماتی — فروشگاه کالا نوبت نمی‌خواهد */}
                  {BOOKING_ENABLED && isBookableCategory(item.category) ? (
                    <Button asChild className="flex-1 gap-1.5 sm:flex-none">
                      <Link to={`/booking/${item.id.replace('store:', '')}`}>
                        <CalendarDays className="size-4" />
                        درخواست نوبت
                      </Link>
                    </Button>
                  ) : (
                    item.phone && (
                      <Button asChild className="flex-1 gap-1.5 sm:flex-none">
                        <a href={`tel:${item.phone.replace(/[^+\d]/g, '')}`}>
                          <Phone className="size-4" />
                          تماس
                        </a>
                      </Button>
                    )
                  )}
                </>
              ) : item.kind === 'product' ? (
                <>
                  {/* رفتن به صفحه‌ی فروشگاه عرضه‌کننده (لینک واقعی) */}
                  {item.storeId && (
                    <Button variant="outline" className="flex-1 gap-1.5 sm:flex-none" onClick={() => openDetail(item.storeId!)}>
                      <Store className="size-4" />
                      فروشگاه
                    </Button>
                  )}
                  {/* The store's phone is not on a product listing, and the
                      lookup that used to stand in for it (SHOP_ENRICHMENT by
                      store name) is gone. It was only ever populated when a
                      product's store name happened to match a row in that
                      file, so this button was usually disabled anyway. The
                      store's own page is the way to reach it now. */}
                  <Button
                    size="lg"
                    disabled
                    className="min-w-0 flex-1 sm:min-w-44 sm:flex-none"
                    title="شماره‌ی تماس این فروشگاه در صفحه‌ی فروشگاه است"
                  >
                    {item.inStock ? 'خرید' : 'ناموجود'}
                  </Button>
                </>
              ) : (
                // A pet listing carries no owner phone, and the lookup that
                // used to supply one (SHOP_ENRICHMENT by owner name) is gone —
                // it only resolved when an owner's display name happened to
                // equal a shop name, which is not a real relationship. The
                // adoption request is the intended way to reach them.
                <Button size="lg" disabled className="min-w-0 flex-1 gap-1.5 sm:min-w-44 sm:flex-none" title="شماره‌ی تماس ثبت نشده است">
                  <Phone className="size-4" />
                  {item.adoptable ? 'تماس با پناهگاه' : 'تماس با مالک'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
