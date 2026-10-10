import { Bone, Heart, MapPin, PawPrint, Star, Store, Tag } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { faDecimal, faDigits, faPriceShort } from '@/lib/fa'
import { formatAge, formatDistance } from '@/lib/geo'
import { cn } from '@/lib/utils'
import type { ListingWithDistance } from '@/types'
import { useFavoritesStore } from '@/store/favorites.store'
import { useUiStore } from '@/store/ui.store'

const KIND_META = {
  pet: { icon: PawPrint, label: 'حیوان', accent: 'text-primary' },
  product: { icon: Bone, label: 'محصول', accent: 'text-tide-600 dark:text-tide-400' },
  store: { icon: Store, label: 'فروشگاه', accent: 'text-accent' },
} as const

/**
 * کارت نتیجه‌ی جهانی (لیست، نوار ویژه، گریدها).
 * چهار فیلد اصلی مشخصات: تصویر، نام، قیمت/وضعیت و «فاصله از شما».
 */
export function ListingCard({ item, index = 0 }: { item: ListingWithDistance; index?: number }) {
  const openDetail = useUiStore((s) => s.openDetail)
  // علاقه‌مندی واقعی: در localStorage ذخیره می‌شود و به نشان قلب نوار ناوبری وصل است
  const liked = useFavoritesStore((s) => s.ids.includes(item.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggle)

  const meta = KIND_META[item.kind]
  const Icon = meta.icon

  // خط وضعیت اصلی، بر اساس نوع آگهی — بدون اختراع امتیاز/نظر
  const status =
    item.kind === 'store'
      ? item.reviewCount > 0
        ? `${faDecimal(item.rating)} ★ · ${faDigits(item.reviewCount)} نظر`
        : 'ثبت‌شده در پازمارکت'
      : item.kind === 'product'
        ? item.inStock
          ? 'موجود در انبار'
          : 'ناموجود'
        : item.adoptable
          ? 'قابل سرپرستی'
          : item.price > 0
            ? 'برای فروش'
            : 'بدون قیمت'

  const priceLabel =
    item.kind === 'store' ? null : item.price === 0 ? 'رایگان' : `${faPriceShort(item.price)} تومان`

  return (
    <article
      /* ورود پله‌ای از سیستم مشترک motion (fail-open: بدون JS هم نمایان) */
      data-motion-item
      style={{ '--motion-delay': `${Math.min(index, 12) * 33}ms` } as React.CSSProperties}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
      onClick={() => openDetail(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openDetail(item.id)
        }
      }}
      aria-label={`مشاهده‌ی جزئیات ${item.name}`}
    >
      {/* تصویر */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.images[0]}
          alt={item.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Graceful degradation: branded placeholder if an asset 404s.
            // NOTE: pass a RAW '#' — encodeURIComponent encodes it once;
            // a pre-encoded %23 would double-encode to %2523 (black fill).
            e.currentTarget.src =
              'data:image/svg+xml;utf8,' +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#f5e9df"/><text x="200" y="165" font-size="72" text-anchor="middle">🐾</text></svg>`,
              )
          }}
        />

        {/* چیپ نوع */}
        <Badge variant="outline" className="absolute right-3 top-3 gap-1 bg-card/90 backdrop-blur">
          <Icon className={cn('size-3', meta.accent)} />
          {meta.label}
        </Badge>

        {/* دکمه‌ی ذخیره */}
        <button
          type="button"
          aria-label={liked ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره‌ی آگهی'}
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(item.id)
          }}
          className={cn(
            'absolute left-3 top-3 grid size-8 place-items-center rounded-full backdrop-blur transition-all active:scale-90',
            liked ? 'bg-primary text-primary-foreground' : 'bg-black/30 text-white hover:bg-black/50',
          )}
        >
          <Heart className={cn('size-4', liked && 'fill-current')} />
        </button>

        {/* چیپ فاصله */}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <MapPin className="size-3" />
          {formatDistance(item.distanceKm)}
        </span>
      </div>

      {/* بدنه */}
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-bold leading-snug transition-colors group-hover:text-primary">
            {item.name}
          </h3>
          {priceLabel && (
            <span className="shrink-0 text-sm font-extrabold text-primary">{priceLabel}</span>
          )}
        </div>

        {/* خط متادیتای نوع‌محور */}
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {item.kind === 'pet'
            ? // join only what exists, so a profile with no breed/age shows
              // just the status instead of "undefined · undefined · …"
              [
                item.breed,
                item.ageMonths !== undefined ? formatAge(item.ageMonths) : undefined,
                status,
              ]
                .filter(Boolean)
                .join(' · ')
            : item.kind === 'product'
              ? `${item.brand} · ${status}`
              : status}
        </p>

        <div className="flex items-center justify-between pt-0.5 text-xs font-medium text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Tag className={cn('size-3 shrink-0', meta.accent)} />
            <span className="truncate">{item.address}</span>
          </span>
          {item.kind === 'store' && (
            <span className="inline-flex shrink-0 items-center gap-1 text-amber-500">
              <Star className="size-3 fill-current" />
              {faDecimal(item.rating)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
