import {
  Bird,
  Bone,
  Cat,
  Dog,
  Fish,
  HeartPulse,
  Home,
  Package,
  Rabbit,
  BedDouble,
  Scissors,
  ShoppingBasket,
  Stethoscope,
  ToyBrick,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useNearbyListings } from '@/hooks/use-listings'
import { faDigits } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { useFiltersStore } from '@/store/filters.store'
import type { Filters, ListingWithDistance } from '@/types'

interface CategoryTile {
  label: string
  icon: typeof Dog
  tint: string
  preset: Partial<Filters>
  match: (item: ListingWithDistance) => boolean
}

interface CategoryGroup {
  title: string
  blurb: string
  tiles: CategoryTile[]
}

/**
 * The catalog mixes three different things — animals for sale/adoption,
 * products, and services — and a single flat row of tiles made them read as
 * interchangeable (a cat sitting next to a bag of kibble). Each group is now
 * labelled and only contains its own kind, and the tiles carry real
 * per-species filters rather than a catch-all "pets".
 */
const GROUPS: CategoryGroup[] = [
  {
    title: 'حیوانات',
    blurb: 'آگهی حیوان خانگی و موارد سرپرستی',
    tiles: [
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
        tint: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
        preset: { kinds: ['pet'], species: ['bird'] },
        match: (l) => l.kind === 'pet' && l.species === 'bird',
      },
      {
        label: 'خرگوش و جوندگان',
        icon: Rabbit,
        tint: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        preset: { kinds: ['pet'], species: ['rabbit', 'small'] },
        match: (l) => l.kind === 'pet' && (l.species === 'rabbit' || l.species === 'small'),
      },
      {
        label: 'ماهی و آبزیان',
        icon: Fish,
        tint: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
        preset: { kinds: ['pet'], species: ['fish'] },
        match: (l) => l.kind === 'pet' && l.species === 'fish',
      },
      {
        label: 'سرپرستی',
        icon: HeartPulse,
        tint: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        preset: { kinds: ['pet'] },
        match: (l) => l.kind === 'pet' && Boolean(l.adoptable),
      },
    ],
  },
  {
    title: 'محصولات',
    blurb: 'خوراک، مکمل، اسباب‌بازی و لوازم',
    tiles: [
      {
        label: 'خوراک و خوراکی',
        icon: Bone,
        tint: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        preset: { kinds: ['product'], categories: ['food'] },
        match: (l) => l.kind === 'product' && l.category === 'food',
      },
      {
        label: 'اسباب‌بازی',
        icon: ToyBrick,
        tint: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
        preset: { kinds: ['product'], categories: ['toy'] },
        match: (l) => l.kind === 'product' && l.category === 'toy',
      },
      {
        label: 'لوازم بهداشتی',
        icon: ShoppingBasket,
        tint: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
        preset: { kinds: ['product'], categories: ['health', 'grooming'] },
        match: (l) => l.kind === 'product' && (l.category === 'health' || l.category === 'grooming'),
      },
      {
        label: 'لوازم و جای خواب',
        icon: Package,
        tint: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
        preset: { kinds: ['product'], categories: ['accessories'] },
        match: (l) => l.kind === 'product' && l.category === 'accessories',
      },
    ],
  },
  {
    title: 'خدمات',
    blurb: 'درمان، آرایش، پانسیون و سرپرستی',
    tiles: [
      {
        label: 'دامپزشکی',
        icon: Stethoscope,
        tint: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
        preset: { kinds: ['store'], categories: ['vet'] },
        match: (l) => l.kind === 'store' && l.category === 'vet',
      },
      {
        label: 'آرایشگاه',
        icon: Scissors,
        tint: 'bg-tide-50 text-tide-600 dark:bg-tide-950/60 dark:text-tide-300',
        preset: { kinds: ['store'], categories: ['groomer'] },
        match: (l) => l.kind === 'store' && l.category === 'groomer',
      },
      {
        label: 'پانسیون',
        icon: BedDouble,
        tint: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        preset: { kinds: ['store'], categories: ['boarding'] },
        match: (l) => l.kind === 'store' && l.category === 'boarding',
      },
      {
        label: 'پناهگاه',
        icon: Home,
        tint: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        preset: { kinds: ['store'], categories: ['shelter'] },
        match: (l) => l.kind === 'store' && l.category === 'shelter',
      },
    ],
  },
]

export function CategoryGrid() {
  const navigate = useNavigate()
  const applyPreset = useFiltersStore((s) => s.applyPreset)
  const { data } = useNearbyListings()
  const listings = data ?? []

  return (
    <section data-motion-section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">دسته‌بندی‌ها</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          تعدادها بر اساس شعاع جستجوی شما زنده به‌روز می‌شود
        </p>
      </div>

      <div className="space-y-9">
        {GROUPS.map((group) => (
          <div key={group.title} data-motion-item>
            <div className="mb-3 flex items-baseline gap-2.5">
              <h3 className="text-base font-extrabold">{group.title}</h3>
              <p className="text-xs text-muted-foreground">{group.blurb}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {group.tiles.map(({ label, icon: Icon, tint, preset, match }, i) => {
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
                    className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-start shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lifted active:scale-[0.98]"
                  >
                    <span
                      className={cn(
                        'grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                        tint,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{label}</span>
                      <span className="block text-xs font-medium text-muted-foreground">
                        {count > 0 ? `${faDigits(count)} مورد در اطراف` : 'کاوش کنید'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}