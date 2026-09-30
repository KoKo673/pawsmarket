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
        const { latitude, longitude } = position.coords
        // Guard against garbage fixes (0,0 / NaN) — keep the fallback
        if (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          !(latitude === 0 && longitude === 0)
        ) {
          // موقعیت خارج از ایران = تقریباً همیشه VPN؛ نقشه را به کشور
          // دیگری نبر و شفاف به کاربر بگو (به‌جای پرواز بی‌صدا به سوئد!)
          if (!isInsideIran(latitude, longitude)) {
            setStatus('out-of-region')
            console.info(
              '[PawsMarket] Geolocation returned a point outside Iran — a VPN/proxy is likely active. Keeping the Tehran origin.',
              { latitude, longitude },
            )
            return
          }
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
