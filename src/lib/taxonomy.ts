/**
 * The catalog's three pillars — حیوانات / محصولات / خدمات.
 *
 * One definition, imported by both the home grid and the explore filter
 * sidebar. They were two hand-maintained lists and had already drifted: the
 * sidebar still grouped a veterinary clinic next to a bag of kibble in one
 * flat row of "دسته‌بندی" chips, which is the exact confusion this module
 * removes. Anything that needs the taxonomy imports it from here.
 */
import {
  BedDouble,
  Bird,
  Bone,
  Cat,
  Dog,
  Fish,
  HeartPulse,
  Home,
  Package,
  Rabbit,
  Scissors,
  ShoppingBasket,
  Stethoscope,
  ToyBrick,
  type LucideIcon,
} from 'lucide-react'

import type { Filters, ListingWithDistance } from '@/types'

/** A category the visitor can filter by, in exactly one pillar. */
export interface CategoryTile {
  /** Stable id — a Species, or a ProductCategory/StoreCategory. */
  id: string
  label: string
  icon: LucideIcon
  tint: string
  /** What the grid/filters do when this tile is picked. */
  preset: Partial<Filters>
  /** Does this listing belong to this tile? */
  match: (item: ListingWithDistance) => boolean
}

export interface CategoryGroup {
  /** Stable id — also the pillar's listing kind. */
  id: 'pet' | 'product' | 'store'
  title: string
  blurb: string
  tiles: CategoryTile[]
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'store',
    title: 'خدمات',
    blurb: 'درمان، آرایش، پانسیون و سرپرستی',
    tiles: [
      {
        id: 'vet',
        label: 'دامپزشکی',
        icon: Stethoscope,
        tint: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
        preset: { kinds: ['store'], categories: ['vet'] },
        match: (l) => l.kind === 'store' && l.category === 'vet',
      },
      {
        id: 'groomer',
        label: 'آرایشگاه',
        icon: Scissors,
        tint: 'bg-tide-50 text-tide-600 dark:bg-tide-950/60 dark:text-tide-300',
        preset: { kinds: ['store'], categories: ['groomer'] },
        match: (l) => l.kind === 'store' && l.category === 'groomer',
      },
      {
        id: 'boarding',
        label: 'پانسیون',
        icon: BedDouble,
        tint: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        preset: { kinds: ['store'], categories: ['boarding'] },
        match: (l) => l.kind === 'store' && l.category === 'boarding',
      },
      {
        id: 'shelter',
        label: 'پناهگاه',
        icon: Home,
        tint: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        preset: { kinds: ['store'], categories: ['shelter'] },
        match: (l) => l.kind === 'store' && l.category === 'shelter',
      },
    ],
  },
  {
    id: 'pet',
    title: 'حیوانات',
    blurb: 'آگهی حیوان خانگی و موارد سرپرستی',
    tiles: [
      {
        id: 'dog',
        label: 'سگ‌ها',
        icon: Dog,
        tint: 'bg-paw-100 text-paw-700 dark:bg-paw-900/40 dark:text-paw-300',
        preset: { kinds: ['pet'], species: ['dog'] },
        match: (l) => l.kind === 'pet' && l.species === 'dog',
      },
      {
        id: 'cat',
        label: 'گربه‌ها',
        icon: Cat,
        tint: 'bg-tide-100 text-tide-700 dark:bg-tide-900/40 dark:text-tide-300',
        preset: { kinds: ['pet'], species: ['cat'] },
        match: (l) => l.kind === 'pet' && l.species === 'cat',
      },
      {
        id: 'bird',
        label: 'پرندگان',
        icon: Bird,
        tint: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
        preset: { kinds: ['pet'], species: ['bird'] },
        match: (l) => l.kind === 'pet' && l.species === 'bird',
      },
      {
        id: 'rabbit',
        label: 'خرگوش و جوندگان',
        icon: Rabbit,
        tint: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        preset: { kinds: ['pet'], species: ['rabbit', 'small'] },
        match: (l) => l.kind === 'pet' && (l.species === 'rabbit' || l.species === 'small'),
      },
      {
        id: 'fish',
        label: 'ماهی و آبزیان',
        icon: Fish,
        tint: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
        preset: { kinds: ['pet'], species: ['fish'] },
        match: (l) => l.kind === 'pet' && l.species === 'fish',
      },
      {
        id: 'adoptable',
        label: 'سرپرستی',
        icon: HeartPulse,
        tint: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        preset: { kinds: ['pet'] },
        match: (l) => l.kind === 'pet' && Boolean(l.adoptable),
      },
    ],
  },
  {
    id: 'product',
    title: 'محصولات',
    blurb: 'خوراک، مکمل، اسباب‌بازی و لوازم',
    tiles: [
      {
        id: 'food',
        label: 'خوراک و خوراکی',
        icon: Bone,
        tint: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        preset: { kinds: ['product'], categories: ['food'] },
        match: (l) => l.kind === 'product' && l.category === 'food',
      },
      {
        id: 'toy',
        label: 'اسباب‌بازی',
        icon: ToyBrick,
        tint: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
        preset: { kinds: ['product'], categories: ['toy'] },
        match: (l) => l.kind === 'product' && l.category === 'toy',
      },
      {
        id: 'health',
        label: 'مکمل و سلامت',
        icon: Stethoscope,
        tint: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
        preset: { kinds: ['product'], categories: ['health'] },
        match: (l) => l.kind === 'product' && l.category === 'health',
      },
      {
        id: 'grooming',
        label: 'آرایشی و بهداشتی',
        icon: ShoppingBasket,
        tint: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
        preset: { kinds: ['product'], categories: ['grooming'] },
        match: (l) => l.kind === 'product' && l.category === 'grooming',
      },
      {
        id: 'accessories',
        label: 'لوازم و جای خواب',
        icon: Package,
        tint: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
        preset: { kinds: ['product'], categories: ['accessories'] },
        match: (l) => l.kind === 'product' && l.category === 'accessories',
      },
    ],
  },
]

/**
 * Count every tile in ONE pass over the listing set.
 *
 * Running `tile.match(l)` per tile meant one full scan of the result set per
 * tile — 15 scans of a few thousand rows on every render, including on every
 * keystroke in the search box. One pass, one map.
 */
export function countTiles(
  listings: ListingWithDistance[],
): Map<CategoryTile, number> {
  const acc = new Map<CategoryTile, number>()
  for (const group of CATEGORY_GROUPS) {
    for (const tile of group.tiles) acc.set(tile, 0)
  }
  for (const item of listings) {
    for (const group of CATEGORY_GROUPS) {
      for (const tile of group.tiles) {
        if (tile.match(item)) acc.set(tile, (acc.get(tile) ?? 0) + 1)
      }
    }
  }
  return acc
}