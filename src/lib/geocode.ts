import type { GeoPoint } from '@/types'

/**
 * Minimal geocoding via OpenStreetMap Nominatim (no API key required).
 * Used by the hero's location field; silent null on any failure so the
 * search never hard-blocks on the network.
 */
export async function geocode(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  // "37.77, -122.42" typed directly → parse as coordinates
  const coords = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)
  if (coords) {
    return { lat: Number(coords[1]), lng: Number(coords[2]) }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const results = (await res.json()) as Array<{ lat: string; lon: string }>
    if (results.length === 0) return null
    return { lat: Number(results[0].lat), lng: Number(results[0].lon) }
  } catch {
    return null
  }
}
