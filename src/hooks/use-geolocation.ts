import { useCallback, useEffect } from 'react'

import { DEFAULT_ORIGIN } from '@/lib/geo'
import { useGeoStore } from '@/store/geo.store'

/**
 * جعبه‌ی ایران (کمی سخاوتمندانه): عرض ۲۴–۴۰ / طول ۴۴–۶۴.
 * اگر مختصات بیرون این محدوده باشد تقریباً همیشه یعنی VPN/پروکسی روشن است
 * و مرورگر موقعیت گره خروجی را می‌دهد — نه موقعیت واقعی کاربر.
 */
function isInsideIran(lat: number, lng: number): boolean {
  return lat >= 24 && lat <= 40 && lng >= 44 && lng <= 64
}

/**
 * Greater Tehran + Karaj, where every listing in this app actually is.
 *
 * A coarse fix — mobile networks and desktop Wi-Fi routinely answer with the
 * ISP's exit node or a cell-tower centroid, and those land tens of kilometres
 * away. Reported from Hakimiyeh, in east Tehran, the map opened on empty
 * mountains ~2 000 m up with no listings anywhere: the coordinates were
 * inside Iran, so the old check accepted them, but nowhere near the city.
 * The app then searched a radius of empty terrain.
 */
const SERVICE_AREA = { latMin: 35.30, latMax: 36.00, lngMin: 50.70, lngMax: 51.90 }

function isInServiceArea(lat: number, lng: number): boolean {
  return lat >= SERVICE_AREA.latMin && lat <= SERVICE_AREA.latMax
    && lng >= SERVICE_AREA.lngMin && lng <= SERVICE_AREA.lngMax
}

/** Horizontal accuracy beyond this is a network estimate, not a position. */
const MAX_USEFUL_ACCURACY_M = 15_000

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
    // مرورگرها مکان‌یابی را فقط در «context امن» می‌دهند؛ روی http://<LAN-IP>
    // (تست با گوشی) بی‌سروصدا بلاک می‌شود — وضعیت را شفاف اعلام کن.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setStatus('insecure')
      console.info(
        '[PawsMarket] Geolocation needs a secure context — open the site via https:// (HTTPS_DEV=1) or localhost.',
      )
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        // Guard against garbage fixes (0,0 / NaN) — keep the fallback
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          (latitude === 0 && longitude === 0)
        ) {
          setStatus('default')
          return
        }

        // خارج از ایران = تقریباً همیشه VPN؛ نقشه را به کشور دیگری نبر
        if (!isInsideIran(latitude, longitude)) {
          setStatus('out-of-region')
          console.info(
            '[PawsMarket] Geolocation returned a point outside Iran — a VPN/proxy is likely active. Keeping the Tehran origin.',
            { latitude, longitude },
          )
          return
        }

        // Inside Iran but far from anywhere this app has listings, or with an
        // accuracy of kilometres: that is a network estimate, not a position.
        // Accepting it moved the map to empty terrain and made every radius
        // search return nothing — exactly the «مرا خارج از شهر نشان میدهد»
        // report. The Tehran origin is far more useful than a wrong fix.
        const accurate = !accuracy || accuracy <= MAX_USEFUL_ACCURACY_M
        const inArea = isInServiceArea(latitude, longitude)
        if (!inArea || !accurate) {
          setStatus('approximate')
          console.info(
            '[PawsMarket] Geolocation fix is too coarse or outside the service '
            + 'area — keeping the Tehran origin.',
            { latitude, longitude, accuracy, inArea },
          )
          return
        }

        setOrigin({ lat: latitude, lng: longitude })
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
