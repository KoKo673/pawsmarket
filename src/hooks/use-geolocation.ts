import { useCallback, useEffect } from 'react'

import { DEFAULT_ORIGIN } from '@/lib/geo'
import { useGeoStore } from '@/store/geo.store'

interface UseGeolocationOptions {
  /**
   * Ask for the location immediately on mount (app-level default: true).
   * Components that only expose a "My Location" button pass false and call
   * `requestLocation()` on demand instead.
   */
  autoRequest?: boolean
  /** Reject stale fixes — 60s keeps "recent enough" for a city search. */
  maximumAgeMs?: number
  timeoutMs?: number
}

/**
 * Browser geolocation bridge.
 *
 * On grant  → store.origin = real coordinates (map flies there, queries re-run)
 * On deny   → status = 'denied', origin stays at the Tehran fallback
 * On pending→ status = 'locating', origin stays at the Tehran fallback
 * No API    → status = 'unsupported'
 *
 * The store holds the state so multiple consumers (app root, map button,
 * search bar) share one request lifecycle.
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { autoRequest = true, maximumAgeMs = 60_000, timeoutMs = 8_000 } = options

  const origin = useGeoStore((s) => s.origin)
  const status = useGeoStore((s) => s.status)
  const setOrigin = useGeoStore((s) => s.setOrigin)
  const setStatus = useGeoStore((s) => s.setStatus)

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        // Guard against garbage fixes (0,0 / NaN) — keep the fallback
        if (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          !(latitude === 0 && longitude === 0)
        ) {
          setOrigin({ lat: latitude, lng: longitude })
        } else {
          setStatus('default')
        }
      },
      (error) => {
        // Permission denied vs. timeout/unavailable — both fall back to Tehran
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'default')
        console.info(
          '[PawsMarket] Geolocation unavailable — keeping Tehran fallback.',
          error.message,
        )
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: maximumAgeMs },
    )
  }, [maximumAgeMs, setOrigin, setStatus, timeoutMs])

  // Detect the user's actual coordinates on mount (spec requirement)
  useEffect(() => {
    if (autoRequest) requestLocation()
  }, [autoRequest, requestLocation])

  return {
    origin,
    status,
    requestLocation,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    fallback: DEFAULT_ORIGIN,
  }
}
