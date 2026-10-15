import { BedDouble, Bone, Heart, HeartHandshake, MapPin, PawPrint, Scissors, Star, Stethoscope, Store, Tag } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { faDecimal, faDigits, faPriceShort } from '@/lib/fa'
import { formatAge, formatDistance } from '@/lib/geo'
import { storeLabel } from '@/lib/store-labels'
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
 * A store's badge names what it actually is.
 *
 * Every service business used to be labelled «فروشگاه», so a veterinary
 * clinic, a grooming salon and an animal shelter all read as shops — the
 * exact confusion the three-pillar taxonomy exists to remove. The badge is
 * the first thing on the card, so it is the worst place to be vague.
 *
 * Only the ICON lives here. The label comes from lib/store-labels.ts, which
 * search.ts needs too — keeping the wording in one place means the badge and
 * the search box can never disagree about what a clinic is called.
 */
const STORE_ICON: Record<string, typeof Store> = {
  vet: Stethoscope,
  groomer: Scissors,
  boarding: BedDouble,
  shelter: HeartHandshake,
  shop: Store,
  cafe: Store,
}

/**
 * کارت نتیجه‌ی جهانی (لیست، نوار ویژه، گریدها).
 * چهار فیلد اصلی مشخصات: تصویر، نام، قیمت/وضعیت و «فاصله از شما».
 */
export function ListingCard({ item, index = 0 }: { item: ListingWithDistance; index?: number }) {
  const openDetail = useUiStore((s) => s.openDetail)
  // علاقه‌مندی واقعی: در localStorage ذخیره می‌شود و به نشان قلب نوار ناوبری وصل است
  const liked = useFavoritesStore((s) => s.ids.includes(item.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggle)

  const base = KIND_META[item.kind]
  // A store's badge names its own category so a clinic never reads as a shop.
  // Icon from the local map, wording from the shared label list.
  const meta = item.kind === 'store'
    ? { ...base, icon: STORE_ICON[item.category] ?? Store,
        label: storeLabel(item.category) || base.label }
    : base
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

  /**
   * «کمترین قیمت ۳۰ روز» — and only ever in the direction that is provable.
   *
   * The subtlety the first two versions missed: `item.price` is THIS shop's
   * price, while the 30-day range belongs to the marketplace listing, which
   * may be a different seller entirely. So the range can only ever support a
   * claim in one direction:
   *
   *   • «this shop is cheaper than the marketplace has been all month» is
   *     TRUE whenever this shop's price sits at or below that low — it is a
   *     statement about this shop, and a genuinely useful one.
   *
   *   • «this shop is at its highest» is NOT supported. The history is not
   *     this shop's history, so a shop priced a few percent above the
   *     marketplace would be branded expensive on somebody else's evidence.
   *     That badge fired on 147 products before it was removed, which is a
   *     warning about a competitor's pricing, not about the shop on screen.
   *
   * Two further guards, each of which was a real defect:
   *   · a flat range says nothing (141 products never moved, and a constant
   *     is trivially «the lowest»), so a minimum spread is required;
   *   · a range with no marketplace price to anchor it is unusable, because
   *     there is then no way to know the two describe the same offer.
   */
  const priceHint = (() => {
    if (item.kind !== 'product' || item.price <= 0) return null
    const { priceLow30d: low, priceHigh30d: high, digikalaPrice } = item
    if (!low || !high || !digikalaPrice || digikalaPrice <= 0) return null
    if ((high - low) / Math.max(1, low) < 0.05) return null
    return item.price <= low * 1.02 ? 'کمترین قیمت ۳۰ روز' : null
  })()

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
      {/* Products use a squarer frame: the marketplace photos are square, and
          a 4:3 box left wide empty margins around each one on a phone, so a
          single card filled most of the screen. Pets and shops stay 4:3 —
          those photos are landscape and fill the frame. */}
      <div
        className={cn(
          'relative overflow-hidden',
          item.kind === 'product' ? 'aspect-[5/4]' : 'aspect-[4/3]',
        )}
      >
        <img
          src={item.images[0]}
          alt={item.name}
          loading="lazy"
          /* Pack shots ( Digikala/Torob are square) are shown whole on a soft
             ground; object-cover would crop a bag of food down to its middle
             band and lose the label the shopper is matching against.
             Pets and storefronts are photographs meant to fill the frame. */
          className={cn(
            'size-full transition-transform duration-500 group-hover:scale-105',
            item.kind === 'product' ? 'object-contain bg-muted/50 p-2' : 'object-cover',
          )}
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
            'absolute left-2 top-2 grid size-11 place-items-center rounded-full backdrop-blur transition-all active:scale-90',
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

        {/* نشان قیمت — همان چیزی که این پلتفرم را از یک فهرست ساده جدا می‌کند */}
        {priceHint && (
          <span className="absolute bottom-3 left-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground backdrop-blur-sm">
            {priceHint}
          </span>
        )}
      </div>

      {/* بدنه */}
      <div className="space-y-1.5 p-4">
        {/* Name above, price below — stacked rather than side by side.
            Beside the name, a long product title («غذای پرنده تاپ فید مدل
            Meal Worm وزن ۴۰ گرم») squeezed the price into a narrow column on
            a phone, and the two fought for the same line. Stacking gives the
            name the full width it needs to wrap, and the price its own row
            where it reads as a price rather than a fragment. */}
        {/* Two lines, not one: a single-line truncate cut every long shop
            name to a dangling «…» («فروشگاه ماهی‌های آکواریومی ما…»), which
            hid the very word that tells the shopper what the shop sells. */}
        <h3 className="line-clamp-2 font-bold leading-snug transition-colors group-hover:text-primary">
          {item.name}
        </h3>
        {priceLabel && (
          <p className="text-sm font-extrabold text-primary">{priceLabel}</p>
        )}

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
              ? // A product's own rating, with the review count behind it —
                // «۳٫۸ ★ · ۲۶ نظر». Shown instead of the brand when present:
                // how buyers rated it says more about a bag of food than the
                // manufacturer's name does.
                item.rating !== undefined && (item.ratingCount ?? 0) > 0
                ? `${faDecimal(item.rating)} ★ · ${faDigits(item.ratingCount!)} نظر`
                : `${item.brand} · ${status}`
              : status}
        </p>

        {/* Footer row.
            Products show the SELLER, not the address: every product inherits
            its shop's coordinates and the address is «تهران» for nearly all
            of them, so the line said nothing while costing vertical space a
            phone does not have. The shop name is what a shopper actually
            needs to decide. */}
        <div className="flex items-center justify-between gap-2 pt-0.5 text-xs font-medium text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Tag className={cn('size-3 shrink-0', meta.accent)} />
            <span className="truncate">
              {item.kind === 'product' ? item.storeName : item.address}
            </span>
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
