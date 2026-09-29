import { Bone, MapPin, Navigation, PawPrint, Phone, ShieldCheck, Store } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { ImageGallery } from '@/components/detail/ImageGallery'
import { StatsGrid } from '@/components/detail/StatsGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { faDecimal, faPrice } from '@/lib/fa'
import { formatDistance } from '@/lib/geo'
import { useNearbyListings } from '@/hooks/use-listings'
import { useUiStore } from '@/store/ui.store'
import type { ListingWithDistance } from '@/types'

const KIND_BADGE = {
  pet: { label: 'حیوان', icon: PawPrint },
  product: { label: 'محصول', icon: Bone },
  store: { label: 'فروشگاه', icon: Store },
} as const

/**
 * برگه‌ی جزئیات جهانی — با باز شدن هر کارت/پین باز می‌شود.
 * دسکتاپ: کارت شناور وسط‌چین؛ موبایل: شیت پایینی (Dialog).
 */
export function DetailModal() {
  const selectedId = useUiStore((s) => s.selectedId)
  const closeDetail = useUiStore((s) => s.closeDetail)
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
          {/* گالری */}
          <ImageGallery images={item.images} alt={item.name} />

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
                    {faDecimal(item.rating)} ★ ({item.reviewCount} نظر)
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* آمار کلیدی */}
          <StatsGrid item={item} />

          {/* توضیحات */}
          <div>
            <h4 className="text-sm font-extrabold">درباره</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </div>

          {/* نوار اعتماد */}
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div className="min-w-0 text-sm leading-snug">
              <p className="font-bold">
                {item.kind === 'pet'
                  ? `ثبت‌کننده: ${item.ownerName}`
                  : item.kind === 'product'
                    ? `فروشنده: ${item.storeName}`
                    : item.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.kind === 'store'
                  ? `همه‌روزه ${item.opensAt} تا ${item.closesAt} · ${item.address}`
                  : 'تاییدشده در پازمارکت · معمولاً کمتر از ۲ ساعت پاسخ می‌دهد'}
              </p>
            </div>
          </div>

          {/* ── CTA شناور پایین ── */}
          <div className="sticky -bottom-6 -mx-6 -mb-6 flex items-center justify-between gap-4 border-t border-border bg-card/95 px-6 py-4 backdrop-blur pb-safe">
            <div>
              {item.kind !== 'store' && (
                <p className="text-xl font-extrabold text-primary">
                  {item.price === 0 ? 'رایگان' : faPrice(item.price)}
                </p>
              )}
              <p className="text-xs font-medium text-muted-foreground">{formatDistance(item.distanceKm)} با شما</p>
            </div>

            <div className="flex shrink-0 gap-2">
              {item.kind === 'store' ? (
                <>
                  <Button
                    variant="outline"
                    className="gap-1.5"
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
                  {item.phone && (
                    <Button asChild className="gap-1.5">
                      <a href={`tel:${item.phone.replace(/[^+\d]/g, '')}`}>
                        <Phone className="size-4" />
                        تماس
                      </a>
                    </Button>
                  )}
                </>
              ) : item.kind === 'product' ? (
                <Button size="lg" disabled={!item.inStock} className="min-w-40">
                  {item.inStock ? 'خرید' : 'ناموجود'}
                </Button>
              ) : (
                <Button size="lg" className="min-w-44 gap-1.5">
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
