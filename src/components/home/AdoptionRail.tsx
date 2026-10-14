import { ChevronLeft, HeartHandshake, MapPin, PawPrint } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNearbyListings } from '@/hooks/use-listings'
import { faDigits } from '@/lib/fa'
import { formatAge, formatDistance } from '@/lib/geo'
import { mediaUrl } from '@/lib/social-api'
import { useUiStore } from '@/store/ui.store'
import type { ListingWithDistance } from '@/types'

/**
 * «در انتظار سرپرستی» — بخش هم‌تراز با کالاها در صفحه‌ی اول.
 *
 * The app has two reasons to exist — the market, and finding homes for
 * animals — and the home page only showed the first. Adoption is the part no
 * competitor offers and the one people share, so it gets the same weight as
 * the product grid rather than a link buried in the footer.
 *
 * Renders from the same nearby query as everything else (one shared React
 * Query cache, no extra request) and stays hidden when there is nothing to
 * show, rather than displaying an empty shelf.
 */
export function AdoptionRail() {
  const { data, isLoading, isError } = useNearbyListings()
  const openDetail = useUiStore((s) => s.openDetail)

  // The type predicate is what lets the JSX below read pet-only fields
  // (breed, ageMonths, gender) without a cast on every line.
  const adoptables = useMemo(
    () =>
      (data ?? []).filter(
        (l): l is Extract<ListingWithDistance, { kind: 'pet' }> =>
          l.kind === 'pet' && Boolean(l.adoptable),
      ),
    [data],
  )

  if (isError) return null
  if (!isLoading && adoptables.length === 0) return null

  return (
    <section data-motion-section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div data-motion-item className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
            <HeartHandshake className="size-3.5" />
            واگذاری و سرپرستی
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            در انتظار سرپرستی
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isLoading
              ? 'در حال بارگذاری…'
              : `${faDigits(adoptables.length)} حیوان در محدوده‌ی جستجوی شما`}
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/adoption">
            <ChevronLeft className="size-4" />
            همه‌ی موارد سرپرستی
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adoptables.slice(0, 8).map((item) => {
            const photo = item.images[0]
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openDetail(item.id)}
                  className="group block w-full overflow-hidden rounded-2xl bg-card text-start shadow-soft ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
                  aria-label={`مشاهده‌ی ${item.name}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {photo ? (
                      <img
                        src={photo.startsWith('http') ? photo : mediaUrl(photo)}
                        alt={item.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid size-full place-items-center bg-muted">
                        <PawPrint className="size-10 text-muted-foreground/40" />
                      </span>
                    )}
                    <Badge
                      variant="accent"
                      className="absolute right-3 top-3 gap-1"
                    >
                      <HeartHandshake className="size-3" />
                      سرپرستی
                    </Badge>
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      <MapPin className="size-3" />
                      {formatDistance(item.distanceKm)}
                    </span>
                  </div>
                  <div className="space-y-1 p-4">
                    <h3 className="line-clamp-1 font-bold leading-snug transition-colors group-hover:text-primary">
                      {item.name}
                    </h3>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {[
                        item.breed,
                        item.ageMonths !== undefined
                          ? formatAge(item.ageMonths)
                          : undefined,
                        item.gender === 'male'
                          ? 'نر'
                          : item.gender === 'female'
                            ? 'ماده'
                            : undefined,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'اطلاعات تکمیلی ثبت نشده'}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}