import {
  Activity,
  Baby,
  Bone,
  Clock,
  Dog,
  MapPin,
  Phone,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Star,
  Syringe,
  Tag,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { faDecimal, faDigits, faPrice } from '@/lib/fa'
import { formatAge, formatDistance } from '@/lib/geo'
import { cn } from '@/lib/utils'
import type { ListingWithDistance, MedicalFlag } from '@/types'

/* ── کاشی آمار کوچک ──────────────────────────────────────────── */

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  // min-w-0 روی هر دو سطح: ستون‌های grid هرگز نباید با min-content
  // (متن بلند/بی‌فاصله) پهن‌تر از کادر خودشان شوند — همان overflow موبایل
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-muted/40 p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 min-w-0 truncate text-sm font-extrabold">{value}</p>
    </div>
  )
}

/* ── چیپ‌های وضعیت پزشکی ─────────────────────────────────────── */

const MEDICAL_META: Record<MedicalFlag, { label: string; className: string }> = {
  vaccinated: { label: 'واکسینه', className: 'bg-accent/15 text-accent' },
  sterilized: { label: 'عقیم‌شده', className: 'bg-tide-500/15 text-tide-700 dark:text-tide-300' },
  microchipped: { label: 'شناسه‌گذاری', className: 'bg-paw-100 text-paw-700 dark:bg-paw-900/50 dark:text-paw-300' },
  'needs-care': { label: 'نیاز به مراقبت', className: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' },
  'checkup-due': { label: 'چکاپ لازم', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
}

/**
 * گرید آمار وابسته به نوع — سن/نژاد/پزشکی برای حیوانات،
 * قیمت/موجودی برای محصولات، امتیاز/ساعات برای فروشگاه‌ها.
 */
export function StatsGrid({ item }: { item: ListingWithDistance }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0 sm:grid-cols-3">
        {item.kind === 'pet' && (
          <>
            {/* Fields the owner never entered are omitted rather than shown as
                a made-up value — «ثبت‌نشده» is honest, «۱ سال» is not. */}
            {item.ageMonths !== undefined && (
              <Stat icon={<Baby className="size-3.5 text-primary" />} label="سن" value={formatAge(item.ageMonths)} />
            )}
            {item.breed && (
              <Stat icon={<Dog className="size-3.5 text-primary" />} label="نژاد" value={item.breed} />
            )}
            {item.gender && (
              <Stat
                icon={<Tag className="size-3.5 text-primary" />}
                label="جنسیت"
                value={item.gender === 'male' ? 'نر' : 'ماده'}
              />
            )}
            <Stat icon={<MapPin className="size-3.5 text-accent" />} label="فاصله" value={formatDistance(item.distanceKm)} />
            {item.price > 0 && (
              <Stat icon={<ShoppingBag className="size-3.5 text-accent" />} label="قیمت" value={faPrice(item.price)} />
            )}
            {item.ownerName && (
              <Stat icon={<ShieldCheck className="size-3.5 text-accent" />} label="ثبت‌کننده" value={item.ownerName} />
            )}
          </>
        )}

        {item.kind === 'product' && (
          <>
            <Stat icon={<Tag className="size-3.5 text-primary" />} label="قیمت" value={faPrice(item.price)} />
            <Stat icon={<Bone className="size-3.5 text-primary" />} label="برند" value={item.brand} />
            <Stat icon={<ShoppingBag className="size-3.5 text-primary" />} label="دسته" value={item.category === 'food' ? 'غذا' : item.category === 'toy' ? 'اسباب‌بازی' : item.category === 'health' ? 'سلامت' : item.category === 'accessories' ? 'لوازم' : 'آرایشی'} />
            <Stat icon={<Activity className="size-3.5 text-accent" />} label="موجودی" value={item.inStock ? 'موجود' : 'ناموجود'} />
            <Stat icon={<MapPin className="size-3.5 text-accent" />} label="فاصله" value={formatDistance(item.distanceKm)} />
            <Stat icon={<Star className="size-3.5 text-accent" />} label="فروشنده" value={item.storeName} />
          </>
        )}

        {item.kind === 'store' && (
          <>
            <Stat
              icon={<Star className="size-3.5 text-amber-500" />}
              label="امتیاز"
              value={
                item.reviewCount > 0
                  ? `${faDecimal(item.rating)} از ${faDigits(item.reviewCount)} نظر`
                  : 'هنوز بدون امتیاز'
              }
            />
            <Stat
              icon={<Clock className="size-3.5 text-primary" />}
              label="ساعات کار"
              value={
                <span className="ltr-inline">
                  {item.opensAt} – {item.closesAt}
                </span>
              }
            />
            <Stat
              icon={<Phone className="size-3.5 text-primary" />}
              label="تلفن"
              value={item.phone ? <span className="ltr-inline">{faDigits(item.phone)}</span> : 'ثبت نشده'}
            />
            <Stat
              icon={<Scissors className="size-3.5 text-primary" />}
              label="دسته"
              value={item.category === 'groomer' ? 'آرایشگاه' : item.category === 'vet' ? 'دامپزشکی' : item.category === 'shelter' ? 'پناهگاه' : item.category === 'boarding' ? 'پانسیون' : item.category === 'cafe' ? 'کافه' : 'فروشگاه'}
            />
            <Stat icon={<MapPin className="size-3.5 text-accent" />} label="فاصله" value={formatDistance(item.distanceKm)} />
            <Stat
              icon={<Activity className="size-3.5 text-accent" />}
              label="حوزه‌ها"
              value={item.categories?.length ? item.categories.slice(0, 3).join('، ') : '—'}
            />
          </>
        )}
      </div>

      {/* وضعیت پزشکی — فقط برای حیوانات */}
      {item.kind === 'pet' && (
        <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Syringe className="size-3.5" />
            وضعیت پزشکی
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {item.medical.map((flag) => (
              <Badge key={flag} variant="outline" className={cn('border-transparent', MEDICAL_META[flag].className)}>
                {MEDICAL_META[flag].label}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
