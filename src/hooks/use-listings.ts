import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchNearbyListings } from '@/lib/api'
import { useFiltersStore } from '@/store/filters.store'
import { useGeoStore } from '@/store/geo.store'

/**
 * The Explore view's primary query (strict — real backend only).
 *
 * The full filter + origin snapshot goes into the query key, so every
 * sidebar/slider change transparently refetches. On failure the query
 * rejects (no mock fallback) and the UI shows an error state with retry.
 * `keepPreviousData` prevents the list from flashing empty while a
 * filter change re-solves.
 */
export function useNearbyListings() {
  const origin = useGeoStore((s) => s.origin)
  const filters = useFiltersStore()

  return useQuery({
    queryKey: ['nearby-listings', origin, filters],
    queryFn: () => fetchNearbyListings(origin, filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
