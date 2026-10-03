import { MapPin, PawPrint, Radar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { faDigits } from '@/lib/fa'
import { formatDistance } from '@/lib/geo'
import { socialApi, type DiscoverPet } from '@/lib/social-api'
import { useGeoStore } from '@/store/geo.store'

const SPECIES_FA: Record<string, string> = {
  dog: 'سگ', cat: 'گربه', rabbit: 'خرگوش', bird: 'پرنده',
  fish: 'ماهی', small: 'حیوان کوچک', other: 'سایر',
}

/** کشف حیوانات نزدیک — کارت‌های پروفایل مرتب بر اساس فاصله واقعی. */
export function PetsDiscoverPage() {
  const origin = useGeoStore((s) => s.origin)
  const [items, setItems] = useState<DiscoverPet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    socialApi
      .discover(origin.lat, origin.lng, 30000)
      .then((d) => alive && setItems(d.items))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'بارگذاری نشد'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [origin.lat, origin.lng])

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
      <header data-motion-section className="mb-8 text-center">
        <span data-motion-item className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1.5 text-xs font-bold text-accent">
          <Radar className="size-3.5" />
          مرتب بر اساس فاصله از شما
        </span>
        <h1 data-motion-item className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          حیوانات نزدیک
        </h1>
        <p data-motion-item className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          پروفایل حیوانات اطراف را ببینید، دنبال کنید و با لحظه‌هایشان همراه شوید.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
          <p className="text-sm font-extrabold">بارگذاری انجام نشد</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card px-6 py-16 text-center shadow-soft">
          <span className="grid size-16 place-items-center rounded-full bg-muted">
            <PawPrint className="size-7 text-muted-foreground/60" />
          </span>
          <p className="mt-4 text-sm font-extrabold">هنوز پروفایلی در این محدوده نیست</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            اولین نفر باشید — برای حیوان‌تان پروفایل بسازید.
          </p>
          <Link to="/me" className="mt-5 text-sm font-bold text-primary hover:underline">
            ساخت پروفایل حیوان
          </Link>
        </div>
      ) : (
        <div data-motion-section="group" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((pet) => (
            <Link
              key={pet.id}
              to={`/pet/${pet.id}`}
              data-motion-item
              className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {pet.avatar_url ? (
                  <img
                    src={pet.avatar_url}
                    alt={pet.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-primary/40">
                    <PawPrint className="size-14" />
                  </span>
                )}
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  <MapPin className="size-3" />
                  {formatDistance(pet.distance_m / 1000)}
                </span>
                {pet.adoption_status === 'available' && (
                  <Badge variant="accent" className="absolute right-3 top-3">
                    آماده‌ی سرپرستی
                  </Badge>
                )}
              </div>
              <div className="space-y-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-bold group-hover:text-primary">{pet.name}</h3>
                  <Badge variant="secondary">{SPECIES_FA[pet.species] ?? pet.species}</Badge>
                </div>
                {pet.bio && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{pet.bio}</p>
                )}
                <p className="pt-0.5 text-[11px] font-semibold text-muted-foreground">
                  {faDigits(0)} لحظه در دسترس
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
