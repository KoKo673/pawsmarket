import {
  ArrowRight, CalendarPlus, Clock, Globe, MapPin, PawPrint, Phone, Star,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { BOOKING_ENABLED } from '@/lib/booking-rules'
import { storeLabel } from '@/lib/store-labels'

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

/** A plain GET. This route is public, so no token and no auth header. */
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`)
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error((body as { detail?: string })?.detail || 'درخواست انجام نشد')
  return body as T
}

/**
 * `image_url` in the database is a bare path with no leading slash —
 * `images/stores/real/abc.jpg`. Put straight into `src`, the browser
 * resolves it against the *current page*, so it became
 * `/store/images/stores/…` and 404'd: measured on the deployed page, the
 * box rendered empty with naturalWidth 0. `mediaUrl` does not cover this
 * because it only rewrites paths that start with `/`.
 */
function storeImage(path: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  return `${API}/${path.replace(/^\//, '')}`
}

/**
 * صفحهٔ عمومی یک مرکز — `/store/:slug`.
 *
 * ── Why this page is the growth channel ──────────────────────────────
 * A clinic has one place it can put a link and be found: its Instagram
 * bio. Until this page existed the product had 27 routes and not one of
 * them was a store — so the only thing a clinic could link to was the
 * map, which shows every competitor around it.
 *
 * The slug is what is linked, not the id: /store/12 says nothing to a
 * customer and breaks the day the row is re-imported. The slug survives
 * a rename of everything except the name itself.
 *
 * ── What it deliberately does not do ─────────────────────────────────
 * No prices, no reviews it cannot verify, no «open now» it cannot be sure
 * of. Opening hours are shown as the clinic typed them. Everything here
 * comes from one row and is the same for every visitor.
 */
interface StoreDetail {
  id: number
  slug: string | null
  name: string
  address: string | null
  category: string | null
  phone: string | null
  description: string | null
  website: string | null
  rating: number | null
  review_count: number | null
  opens_at: string | null
  closes_at: string | null
  image_url: string | null
  categories: string[] | null
  lat: number | null
  lng: number | null
}

const FA = new Intl.NumberFormat('fa-IR')

/** `09:00:00` → «۹:۰۰» — both sides in Persian digits, not just the hour. */
function faTime(value: string | null): string {
  if (!value) return ''
  const [h, m] = value.split(':')
  return `${FA.format(Number(h))}:${FA.format(Number(m ?? '00')).padStart(2, '۰')}`
}

export function StorePage() {
  const { slug } = useParams<{ slug: string }>()

  const query = useQuery({
    queryKey: ['store-by-slug', slug],
    queryFn: () => getJson<StoreDetail>(
      `/api/stores/by-slug/${encodeURIComponent(slug ?? '')}`),
    enabled: !!slug,
    retry: false,
  })

  if (query.isLoading) {
    return (
      <Shell>
        <div className="grid place-items-center py-24" role="status" aria-live="polite">
          <PawPrint className="size-8 animate-pulse text-primary" aria-hidden="true" />
          <span className="sr-only">در حال باز کردن صفحهٔ مرکز…</span>
        </div>
      </Shell>
    )
  }

  if (query.isError || !query.data) {
    return (
      <Shell>
        <div className="glass rounded-3xl p-8 text-center">
          <p className="text-lg font-extrabold">این مرکز پیدا نشد</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            ممکن است نشانی عوض شده باشد. از نقشه، مراکز نزدیک خودتان را ببینید.
          </p>
          <Button asChild size="lg" className="mt-5 w-full gap-2">
            <Link to="/explore">
              <ArrowRight className="size-4" aria-hidden="true" />
              دیدن مراکز نزدیک
            </Link>
          </Button>
        </div>
      </Shell>
    )
  }

  const s = query.data
  const hours = s.opens_at && s.closes_at
    ? `${faTime(s.opens_at)} تا ${faTime(s.closes_at)}`
    : null
  const phone = (s.phone ?? '').replace(/[^+\d]/g, '')

  return (
    <Shell>
      <article className="glass overflow-hidden rounded-3xl shadow-lifted">
        {s.image_url && (
          <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
            <img src={storeImage(s.image_url)} alt=""
                 className="size-full object-cover" loading="eager" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {storeLabel(s.category) && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {storeLabel(s.category)}
              </span>
            )}
            {s.rating != null && s.rating > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                <Star className="size-3.5" aria-hidden="true" />
                {FA.format(s.rating)}
                {s.review_count ? (
                  <span className="font-normal text-muted-foreground">
                    ({FA.format(s.review_count)} نظر)
                  </span>
                ) : null}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {s.name}
          </h1>

          {s.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {s.description}
            </p>
          )}

          {/* ── عملی که زائر آمده انجام دهد ── */}
          <div className="mt-6 grid gap-2.5">
            {phone && (
              <Button asChild size="lg" className="w-full gap-2">
                <a href={`tel:${phone}`}>
                  <Phone className="size-4" aria-hidden="true" />
                  <span dir="ltr" className="whitespace-nowrap">{s.phone}</span>
                </a>
              </Button>
            )}

            {BOOKING_ENABLED && (
              <Button asChild variant="outline" size="lg" className="w-full gap-2">
                <Link to={`/booking/${s.id}`}>
                  <CalendarPlus className="size-4" aria-hidden="true" />
                  درخواست نوبت
                </Link>
              </Button>
            )}

            {s.website && (
              <Button asChild variant="ghost" size="lg" className="w-full gap-2">
                <a href={s.website} target="_blank" rel="noopener noreferrer nofollow">
                  <Globe className="size-4" aria-hidden="true" />
                  وب‌سایت مرکز
                </a>
              </Button>
            )}
          </div>

          {/* ── جای و ساعت ── */}
          <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
            {s.address && (
              <div className="flex items-start gap-2">
                <dt className="shrink-0 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4" aria-hidden="true" />
                  <span className="sr-only">نشانی</span>
                </dt>
                <dd className="min-w-0 leading-relaxed">{s.address}</dd>
              </div>
            )}

            {hours && (
              <div className="flex items-start gap-2">
                <dt className="shrink-0 text-muted-foreground">
                  <Clock className="mt-0.5 size-4" aria-hidden="true" />
                  <span className="sr-only">ساعت کاری</span>
                </dt>
                <dd className="leading-relaxed">{hours}</dd>
              </div>
            )}

            {/* The raw category codes are not shown: «vet» means nothing to a
                visitor and the label above already says «دامپزشکی». */}
          </dl>

          {s.lat != null && s.lng != null && (
            <Button asChild variant="outline" size="lg" className="mt-5 w-full gap-2">
              <a href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=17/${s.lat}/${s.lng}`}
                 target="_blank" rel="noopener noreferrer">
                <MapPin className="size-4" aria-hidden="true" />
                دیدن روی نقشه
              </a>
            </Button>
          )}
        </div>
      </article>

      <p className="mt-6 flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
        <PawPrint className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
        اطلاعات این صفحه را خود مرکز در پازمارکت ثبت کرده است. اگر چیزی
        نادرست بود، از{' '}
        <Link to="/support" className="font-bold text-primary hover:underline">
          پشتیبانی
        </Link>
        {' '}بگویید.
      </p>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-20 pt-24 sm:px-6">
      {children}
    </div>
  )
}
