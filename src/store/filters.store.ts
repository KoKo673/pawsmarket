import { create } from 'zustand'

import type { Filters, ListingKind, ProductCategory, SortOption, Species, StoreCategory } from '@/types'

/** Wide defaults — the radius/price sliders narrow from here (Toman).
 *  Price window matches the real catalog (≈285k–2.15M Toman) with a
 *  50k step so dragging never jumps over actual product prices. */
const DEFAULT_PRICE: [number, number] = [0, 3_000_000]

interface FilterState extends Filters {
  /** Reset every control to its default (bound to the sidebar's "Clear"). */
  resetFilters: () => void
  setQuery: (query: string) => void
  setRadiusKm: (radiusKm: number) => void
  setPriceRange: (range: [number, number]) => void
  setSort: (sort: SortOption) => void
  /** Add/remove a listing kind; toggling all off reverts to "show everything". */
  toggleKind: (kind: ListingKind) => void
  toggleSpecies: (species: Species) => void
  toggleCategory: (category: ProductCategory | StoreCategory) => void
  /** Apply a whole preset at once (quick-filter pills on the hero). */
  applyPreset: (preset: Partial<Filters>) => void
}

const initial: Filters = {
  query: '',
  radiusKm: 10,
  priceRange: DEFAULT_PRICE,
  kinds: [],
  species: [],
  categories: [],
  sort: 'distance',
}

/**
 * Global filter state for the Explore view.
 * Lives in Zustand (not React Query) because it drives *both* the query key
 * and the sidebar UI — one source of truth, no prop drilling.
 */
export const useFiltersStore = create<FilterState>((set) => ({
  ...initial,

  resetFilters: () => set(initial),
  setQuery: (query) => set({ query }),
  setRadiusKm: (radiusKm) => set({ radiusKm }),
  setPriceRange: (priceRange) => set({ priceRange }),
  setSort: (sort) => set({ sort }),

  toggleKind: (kind) =>
    set((state) => {
      const kinds = state.kinds.includes(kind)
        ? state.kinds.filter((k) => k !== kind)
        : [...state.kinds, kind]
      return { kinds: kinds.length === 3 ? [] : kinds }
    }),

  toggleSpecies: (species) =>
    set((state) => ({
      species: state.species.includes(species)
        ? state.species.filter((s) => s !== species)
        : [...state.species, species],
    })),

  toggleCategory: (category) =>
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories.filter((c) => c !== category)
        : [...state.categories, category],
    })),

  /** Quick pills set a coherent slice (kinds+species+categories+query). */
  applyPreset: (preset) => set({ ...initial, radiusKm: 10, ...preset }),
}))
