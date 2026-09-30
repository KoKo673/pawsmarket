import { Crosshair, Loader2, MapPin, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGeolocation } from '@/hooks/use-geolocation'
import { geocode } from '@/lib/geocode'
import { useFiltersStore } from '@/store/filters.store'
import { useGeoStore, type GeoStatus } from '@/store/geo.store'

function locationPlaceholder(status: GeoStatus): string {
  switch (status) {
    case 'active':
      return 'مکان فعلی من'
    case 'locating':
      return 'در حال پیدا کردن شما…'
    case 'denied':
      return 'دسترسی مسدود — نام محله را بنویسید'
    case 'insecure':
      return 'برای مکان‌یابی سایت را با https باز کنید'
    default:
      return 'تهران'
  }
}

/**
 * Hero search: Location + Keyword (Persian/RTL).
 * Submit → geocode the location (OSM, keyless; accepts «تهران» or lat,lng)
 * → push origin + keyword into the global stores → navigate to /explore.
 */
export function SearchBar() {
  const navigate = useNavigate()
  const { status, requestLocation } = useGeolocation({ autoRequest: false })
  const setOrigin = useGeoStore((s) => s.setOrigin)
  const setQuery = useFiltersStore((s) => s.setQuery)

  const [location, setLocation] = useState('')
  const [keyword, setKeyword] = useState('')
  const [geocoding, setGeocoding] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setGeocoding(true)
    // Best-effort geocode; failure simply keeps the current origin
    if (location.trim()) {
      const point = await geocode(location)
      if (point) setOrigin(point)
    }
    setQuery(keyword)
    setGeocoding(false)
    navigate('/explore')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass flex w-full max-w-2xl flex-col gap-2 rounded-3xl p-2 shadow-lifted sm:flex-row sm:items-center sm:rounded-full"
      role="search"
    >
      {/* Location field */}
      <div className="relative flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5">
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={locationPlaceholder(status)}
          aria-label="مکان"
          className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={requestLocation}
          aria-label="استفاده از مکان فعلی"
          title="استفاده از مکان فعلی"
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          {status === 'locating' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Crosshair className="size-4" />
          )}
        </button>
      </div>

      <div className="hidden h-8 w-px bg-border sm:block" aria-hidden />

      {/* Keyword field */}
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="سگ، غذای گربه، دامپزشک…"
          aria-label="جستجو"
          className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <Button type="submit" size="lg" className="h-12 shrink-0 gap-2 rounded-2xl sm:rounded-full" disabled={geocoding}>
        {geocoding ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        جستجو
      </Button>
    </form>
  )
}
