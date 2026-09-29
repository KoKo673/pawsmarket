import { faDigits } from '@/lib/fa'
import type { GeoPoint } from '@/types'

/** Tehran, Iran — the Iranian-market default until the user shares location. */
export const DEFAULT_ORIGIN: GeoPoint = { lat: 35.6892, lng: 51.389 }

/**
 * Great-circle distance (km) between two points — the client-side mirror
 * of the server's `ST_Distance` / `ST_DWithin` geo math.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371 // Earth radius, km
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Human-friendly Persian distance label.
 *   0.05 km → «۵۰ متر» · 2.43 km → «۲٫۴ کیلومتر» · 87 km → «۸۷ کیلومتر»
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${faDigits(Math.round(km * 1000))} متر`
  if (km < 10) return `${faDigits(km.toFixed(1)).replace('.', '٫')} کیلومتر`
  return `${faDigits(Math.round(km))} کیلومتر`
}

/** Age in months → «۴ ماه» / «۲ سال» / «۱ سال و۳ ماه». */
export function formatAge(ageMonths: number): string {
  if (ageMonths < 12) return `${faDigits(ageMonths)} ماه`
  const years = Math.floor(ageMonths / 12)
  const months = ageMonths % 12
  const yearsLabel = `${faDigits(years)} سال`
  return months === 0 ? yearsLabel : `${yearsLabel} و ${faDigits(months)} ماه`
}
