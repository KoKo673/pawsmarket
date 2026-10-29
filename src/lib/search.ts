import { normaliseFa } from '@/lib/fa-normalise'
import { haversineKm } from '@/lib/geo'
import { storeLabel } from '@/lib/store-labels'
import type { Filters, GeoPoint, Listing, ListingWithDistance } from '@/types'

/**
 * Client-side geo-search pipeline.
 *
 * Mirrors what PostGIS does server-side (`ST_DWithin` + `ORDER BY ST_Distance`)
 * so the mock fallback and live API results behave identically: attach
 * distance → drop outside the radius → apply keyword/kind/species/price → sort.
 */
export function applyFilters(listings: Listing[], origin: GeoPoint, filters: Filters): ListingWithDistance[] {
  const query = normaliseFa(filters.query).toLowerCase()
  const [priceMin, priceMax] = filters.priceRange

  const withDistance = listings.map((listing) => ({
    ...listing,
    distanceKm: haversineKm(origin, listing.location),
  }))

  const filtered = withDistance.filter((item) => {
    // 1. Geo radius (a listing with no distance could never appear anyway)
    if (item.distanceKm > filters.radiusKm) return false

    // 2. Kind toggles (pet / product / store) — empty selection = all
    if (filters.kinds.length > 0 && !filters.kinds.includes(item.kind)) return false

    // 3. Species chips — only constrain pet listings; products/stores pass
    if (filters.species.length > 0 && item.kind === 'pet' && !filters.species.includes(item.species)) {
      return false
    }

    // 3b. Category chips (food / toy / vet / groomer …) — pets drop out
    //     entirely when a product-or-store category is selected
    if (filters.categories.length > 0) {
      if (item.kind === 'pet') return false
      if (!filters.categories.includes(item.category)) return false
    }

    // 4. Price window — stores are filtered out of price logic (no price field)
    if (item.kind !== 'store') {
      if (item.price < priceMin || item.price > priceMax) return false
    }

    // 5. Keyword match across the searchable surface of each kind
    //
    // The store branch is spelled out rather than interpolated inline, because
    // it is the one that changed: `item.category` holds the CODE («vet»), so a
    // visitor typing «دامپزشکی» could never match it — the word only existed
    // in the generated `description`. The Persian label and the scope list
    // (`categories`, which the API has always sent but nothing ever searched)
    // replace that, and they are real structured data rather than template
    // prose. Pets and products are untouched: their descriptions come from the
    // API, not from the enrichment file this change is about.
    if (query) {
      const haystack =
        item.kind === 'pet'
          ? `${item.name} ${item.breed} ${item.species} ${item.description}`
          : item.kind === 'product'
            ? `${item.name} ${item.brand} ${item.category} ${item.storeName} ${item.description}`
            : `${item.name} ${storeLabel(item.category)} ${item.address} ` +
              `${(item.categories ?? []).join(' ')}`
      if (!normaliseFa(haystack).toLowerCase().includes(query)) return false
    }

    return true
  })

  // Sort — price sorts place stores (no price) last, as they're location-first
  switch (filters.sort) {
    case 'distance':
      filtered.sort((a, b) => a.distanceKm - b.distanceKm)
      break
    case 'price-asc':
      filtered.sort((a, b) => priceOf(a) - priceOf(b))
      break
    case 'price-desc':
      filtered.sort((a, b) => priceOf(b) - priceOf(a))
      break
    case 'newest':
      filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      break
  }

  return filtered
}

/** Stores have no price; pin them to the end of price-sorted lists. */
function priceOf(item: ListingWithDistance): number {
  return item.kind === 'store' ? Number.POSITIVE_INFINITY : item.price
}
