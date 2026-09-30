import { create } from 'zustand'

import { DEFAULT_ORIGIN } from '@/lib/geo'
import type { GeoPoint } from '@/types'

export type GeoStatus =
  | 'default'
  | 'locating'
  | 'active'
  | 'denied'
  | 'unsupported'
  | 'insecure'
  /** موقعیت برگشتی خارج از ایران است (تقریباً همیشه: VPN روشن) */
  | 'out-of-region'

interface GeoState {
  /** Center of every nearby query + map flyTo. Starts at Tehran. */
  origin: GeoPoint
  status: GeoStatus
  /** Manually re-center (search-by-location, map click in the Add wizard). */
  setOrigin: (point: GeoPoint) => void
  /** Lifecycle updates from the useGeolocation hook (navigator lives there). */
  setStatus: (status: GeoStatus) => void
}

/**
 * Search-origin state shared by the hero, the Explore map and the API layer.
 *
 * The default is **Tehran (35.6892, 51.3890)** — permission pending, denied
 * or unsupported all keep this fallback, so the Iranian catalog is always
 * meaningful before (or without) a GPS fix.
 */
export const useGeoStore = create<GeoState>((set) => ({
  origin: DEFAULT_ORIGIN,
  status: 'default',

  setOrigin: (point) => set({ origin: point, status: 'active' }),
  setStatus: (status) => set({ status }),
}))
