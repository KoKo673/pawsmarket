import { Bird, Bone, Cat, Dog, Scissors, Stethoscope } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { faDigits } from '@/lib/fa'
import { useNearbyListings } from '@/hooks/use-listings'
import { cn } from '@/lib/utils'
import { useFiltersStore } from '@/store/filters.store'
import type { Filters, ListingWithDistance } from '@/types'

const CATEGORIES: Array<{
  label: string
  icon: typeof Dog
  tint: string
  preset: Partial<Filters>
  match: (item: ListingWithDistance) => boolean
}> = [
  {
    label: 'سگ‌ها',
    icon: Dog,
    tint: 'bg-paw-100 text-paw-700 dark:bg-paw-900/40 dark:text-paw-300',
    preset: { kinds: ['pet'], species: ['dog'] },
    match: (l) => l.kind === 'pet' && l.species === 'dog',
  },
  {
    label: 'گربه‌ها',
    icon: Cat,
    tint: 'bg-tide-100 text-tide-700 dark:bg-tide-900/40 dark:text-tide-300',
    preset: { kinds: ['pet'], species: ['cat'] },
    match: (l) => l.kind === 'pet' && l.species === 'cat',
  },
  {
    label: 'پرندگان',
    icon: Bird,
    tint: 'bg-paw-50 text-paw-600 dark:bg-paw-950/60 dark:text-paw-300',
    preset: { kinds: ['pet'], species: ['bird'] },
    match: (l) => l.kind === 'pet' && l.species === 'bird',
  },
  {
    label: 'غذای حیوان',
    icon: Bone,
    tint: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    preset: { kinds: ['product'], categories: ['food'] },
    match: (l) => l.kind === 'product' && l.category === 'food',
  },
  {
    label: 'دامپزشکان',
    icon: Stethoscope,
    tint: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
    preset: { kinds: ['store'], categories: ['vet'] },
    match: (l) => l.kind === 'store' && l.category === 'vet',
  },
  {
    label: 'آرایشگاه‌ها',
    icon: Scissors,
    tint: 'bg-tide-50 text-tide-600 dark:bg-tide-950/60 dark:text-tide-300',
    preset: { kinds: ['store'], categories: ['groomer'] },
    match: (l) => l.kind === 'store' && l.category === 'groomer',
  },
]

/**
 * شش کاشی دسته‌بندی با شمارنده‌ی زنده از همان کوئری کاوش —
 * تعداد «در اطراف» از داده‌ی لحظه‌ای پر می‌شود.
 */
export function CategoryGrid() {
  const navigate = useNavigate()
  const applyPreset = useFiltersStore((s) => s.applyPreset)
  const { data } = useNearbyListings()
  const listings = data ?? []

  return (
    <section data-motion-section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">دسته‌بندی‌ها</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">تعدادها بر اساس شعاع جستجوی شما زنده به‌روز می‌شوند</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map(({ label, icon: Icon, tint, preset, match }, i) => {
          const count = listings.filter((l) => match(l)).length
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                applyPreset(preset)
                navigate('/explore')
              }}
              style={{ animationDelay: `${i * 60}ms` }}
              data-motion-item
              className="group rounded-2xl border border-border/60 bg-card p-5 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lifted active:scale-95"
            >
              <span
                className={cn(
                  'mx-auto grid size-14 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6',
                  tint,
                )}
              >
                <Icon className="size-7" />
              </span>
              <p className="mt-3 text-sm font-bold">{label}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {count > 0 ? `${faDigits(count)} مورد در اطراف` : 'کاوش کنید'}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
