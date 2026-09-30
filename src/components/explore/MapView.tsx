import { Crosshair, Loader2, ShieldAlert } from 'lucide-react'
import L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
// Leaflet's own stylesheet — tiles/markers/panes are position:absolute here;
// without it everything falls into normal flow and the map shreds apart.
import 'leaflet/dist/leaflet.css'

import { useGeolocation } from '@/hooks/use-geolocation'
import { faPriceShort } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { useGeoStore, type GeoStatus } from '@/store/geo.store'
import { useUiStore } from '@/store/ui.store'
import type { GeoPoint, ListingWithDistance } from '@/types'

/**
 * Playful Airbnb-style marker: a white price/status pill with a pointer
 * tail, colored dot per kind. Rendered as inline-styled HTML inside a
 * Leaflet divIcon — Tailwind classes aren't guaranteed to cascade into
 * Leaflet's panes, so styles are inlined here on purpose.
 */
function createDivIcon(item: ListingWithDistance): L.DivIcon {
  const dotColor = item.kind === 'pet' ? '#FA5C00' : item.kind === 'product' ? '#14B8A6' : '#0EA5A4'
  const label =
    item.kind === 'store'
      ? '📍'
      : item.price === 0
        ? 'سرپرستی'
        : faPriceShort(item.price)

  const html = `
    <div style="
      display:flex;align-items:center;gap:6px;
      background:#fff;color:#1C1A17;
      font:700 12px/1 Vazirmatn,system-ui,sans-serif;
      padding:7px 11px;border-radius:999px;
      box-shadow:0 4px 14px rgba(0,0,0,.22);
      border:1.5px solid rgba(0,0,0,.06);
      white-space:nowrap;transform:translateY(0);
      transition:transform .15s ease;
    ">
      <span style="width:8px;height:8px;border-radius:999px;background:${dotColor};flex:none"></span>
      ${label}
      <svg width="10" height="6" viewBox="0 0 10 6" style="position:absolute;left:50%;bottom:-5px;transform:translateX(-50%)">
        <path d="M0 0h10L5 6z" fill="#fff"/>
      </svg>
    </div>
  `

  return L.divIcon({
    html,
    className: '',
    iconSize: undefined, // let Leaflet size from content
    iconAnchor: [24, 40],
  })
}

/**
 * Keeps the map alive across visibility changes and origin updates.
 *
 * · Geolocation granted → flyTo the real coordinates at neighborhood zoom
 * · Search / manual re-center → reframe at the current city zoom
 * · Hidden tab → instant setView (frame-driven animations freeze there)
 * · Hidden → visible transitions → invalidateSize + snap (Leaflet caches
 *   its size and never recomputes on its own)
 */
function MapSync({ origin }: { origin: GeoPoint }) {
  const map = useMap()
  const status = useGeoStore((s) => s.status)
  const originRef = useRef(origin)
  originRef.current = origin

  /**
   * IMPORTANT: Leaflet caches its size (`map.getSize()` returns the stale
   * `{0,0}` computed while the container was display:none and never
   * recomputes on its own). Always read `container.clientWidth/Height`
   * directly — those hit the DOM and are fresh.
   */
  const hasPixels = () => {
    const c = map.getContainer()
    return c.clientWidth > 0 && c.clientHeight > 0
  }

  // Reframe when the origin moves (GPS fix, «مکان من», or search geocode)
  useEffect(() => {
    if (!hasPixels()) return

    // Map already sits on this point (initial render) — nothing to do
    const center = map.getCenter()
    if (Math.abs(center.lat - origin.lat) < 1e-6 && Math.abs(center.lng - origin.lng) < 1e-6) return

    // A real GPS fix deserves a closer look than the city-wide default
    const zoom: number = status === 'active' ? Math.max(map.getZoom(), 14) : Math.max(map.getZoom(), 12)

    if (document.visibilityState === 'visible') {
      map.flyTo([origin.lat, origin.lng], zoom, { duration: 1.1 })
    } else {
      map.setView([origin.lat, origin.lng], zoom, { animate: false })
    }
  }, [map, origin, status])

  // Detect hidden → visible and recover the projection
  useEffect(() => {
    const container = map.getContainer()
    let wasHidden = container.clientWidth === 0

    const check = () => {
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        wasHidden = true
        return
      }
      if (wasHidden) {
        wasHidden = false
        map.invalidateSize({ animate: false })
        const o = originRef.current
        map.setView([o.lat, o.lng], Math.max(map.getZoom(), 12), { animate: false })
      }
    }

    // Primary: ResizeObserver (frame-driven — fine for real users)
    const observer = new ResizeObserver(check)
    observer.observe(container)
    // Backup: timer poll — ResizeObserver/rAF never fire in backgrounded
    // tabs, but timers still tick, so recovery can't get stuck there either.
    const interval = setInterval(check, 500)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [map])

  return null
}

/** "You are here" — pulsing brand dot pinned at the true origin coordinate. */
const originIcon = L.divIcon({
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: `<span style="
    display:block;width:14px;height:14px;border-radius:999px;
    background:#FA5C00;border:3px solid #fff;
    box-shadow:0 0 0 6px rgba(250,92,0,.28), 0 2px 10px rgba(0,0,0,.3);
  "></span>`,
})

const STATUS_HINT: Record<GeoStatus, string> = {
  default: 'برای پیدا کردن مکان واقعی‌تان اجازه‌ی دسترسی بدهید',
  locating: 'در حال دریافت مکان…',
  active: 'نقشه روی مکان واقعی شماست — برای بازگشت دوباره بزنید',
  denied: 'دسترسی به مکان رد شد — نقشه روی تهران می‌ماند',
  unsupported: 'مرورگر شما از مکان‌یابی پشتیبانی نمی‌کند',
  insecure: 'مکان‌یابی فقط روی HTTPS کار می‌کند — با آدرس https باز کنید (راهنمای dev.cmd)',
}

/**
 * Floating «مکان من» (My Location) control — modern glass crosshair button
 * pinned to the map's logical start edge (right side in RTL).
 */
function MyLocationButton() {
  const { status, requestLocation } = useGeolocation({ autoRequest: false })
  const locating = status === 'locating'

  return (
    <button
      type="button"
      onClick={requestLocation}
      disabled={locating}
      title={STATUS_HINT[status]}
      aria-label="مکان من"
      className={cn(
        'absolute top-4 start-4 z-[800] inline-flex h-11 items-center gap-2 rounded-full px-4',
        'glass text-sm font-bold shadow-lifted transition-all duration-200',
        'hover:shadow-glow active:scale-95 disabled:opacity-80',
        status === 'denied' && 'ring-1 ring-destructive/40',
      )}
    >
      {locating ? (
        <Loader2 className="size-4 animate-spin text-primary" />
      ) : status === 'insecure' ? (
        <ShieldAlert className="size-4 text-destructive" />
      ) : (
        <Crosshair className={cn('size-4', status === 'active' ? 'text-primary' : 'text-muted-foreground')} />
      )}
      {locating ? 'در حال مکان‌یابی…' : status === 'insecure' ? 'نیازمند HTTPS' : 'مکان من'}
    </button>
  )
}

interface MapViewProps {
  listings: ListingWithDistance[]
  origin: GeoPoint
  /** Called when a marker pin is clicked. */
  onSelect: (id: string) => void
  className?: string
}

/**
 * Interactive geospatial pane (Iranian market default: Tehran).
 * Tiles: keyless OSM, dark mode via CSS invert (see index.css).
 * Container is `isolate-map` wrapped so Leaflet's internal z-indexes can
 * never paint over the z-nav navbar.
 */
export function MapView({ listings, origin, onSelect, className }: MapViewProps) {
  const theme = useUiStore((s) => s.theme)

  // Rebuild markers only when the result set changes
  const markers = useMemo(() => listings.map((item) => [item, createDivIcon(item)] as const), [listings])

  return (
    <div
      className={`isolate-map relative h-full w-full overflow-hidden rounded-none lg:rounded-3xl ${theme === 'dark' ? 'dark-tiles' : ''} ${className ?? ''}`}
    >
      <MapContainer
        center={[origin.lat, origin.lng]}
        zoom={12}
        zoomControl={false}
        // Tile opacity fades are CSS transitions — they look nice but can
        // freeze mid-fade in throttled/backgrounded tabs, leaving gaps.
        fadeAnimation={false}
        className="h-full w-full bg-muted"
        attributionControl
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapSync origin={origin} />

        <Marker position={[origin.lat, origin.lng]} icon={originIcon} interactive={false} zIndexOffset={1000} />

        {markers.map(([item, icon]) => (
          <Marker
            key={item.id}
            position={[item.location.lat, item.location.lng]}
            icon={icon}
            eventHandlers={{ click: () => onSelect(item.id) }}
          />
        ))}
      </MapContainer>

      {/* «مکان من» — re-center on the real GPS position */}
      <MyLocationButton />
    </div>
  )
}
