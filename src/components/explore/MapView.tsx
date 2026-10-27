import { Crosshair, Loader2, ShieldAlert } from 'lucide-react'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
// Leaflet's own stylesheet — tiles/markers/panes are position:absolute here;
// without it everything falls into normal flow and the map shreds apart.
import 'leaflet/dist/leaflet.css'

import { useGeolocation } from '@/hooks/use-geolocation'
import { faDigits, faPriceShort } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { useGeoStore, type GeoStatus } from '@/store/geo.store'
import { useUiStore } from '@/store/ui.store'
import type { GeoPoint, ListingWithDistance } from '@/types'

/**
 * What a screen reader announces for a listing pin.
 *
 * The pin shows a price or «سرپرستی», which is not enough on its own: «۶۲۸»
 * names nothing. This says what kind of listing it is and what it costs, and
 * stops short of the shop name because `markerIcon` only receives the fields
 * the map draws from.
 */
function markerLabel(item: ListingWithDistance): string {
  const kind = item.kind === 'pet' ? 'حیوان' : item.kind === 'product' ? 'محصول' : 'فروشگاه'
  if (item.kind === 'store') return `${kind}: ${item.name}`
  if (item.price === 0) return `${kind} برای سرپرستی: ${item.name}`
  return `${kind}: ${item.name} — ${faPriceShort(item.price)} تومان`
}

/**
 * Playful Airbnb-style marker: a white price/status pill with a pointer
 * tail, colored dot per kind. Rendered as inline-styled HTML inside a
 * Leaflet divIcon — Tailwind classes aren't guaranteed to cascade into
 * Leaflet's panes, so styles are inlined here on purpose.
 *
 * Icons are cached by their visible label: with 200+ listings many share the
 * same rounded price («۱٫۵م» etc.), and one divIcon per distinct label means
 * Leaflet clones a template instead of rebuilding identical DOM each time.
 */
const iconCache = new Map<string, L.DivIcon>()

function markerIcon(item: ListingWithDistance): L.DivIcon {
  /* One teardrop pin for every single listing, in the listing's own colour.
   *
   * The previous marker was a white pill whose label for a SERVICE STORE was
   * the character «📍» — a pin emoji inside a pill, next to cluster bubbles
   * that are an orange disc with a paw. Three shapes, three weight classes,
   * no shared language: at city zoom the map read as scattered debris rather
   * than as places. It also said nothing: a shopper could not tell a clinic
   * from a groomer without opening it.
   *
   * A teardrop is the one shape everybody already reads as "a place on a
   * map", and its tip is the anchor, so it points at the coordinate instead
   * of hovering above it. Products keep their price on the pin because price
   * is what a shopper compares; pets keep a paw; a service store gets its
   * category glyph, which is the thing that distinguishes دو مرکز از هم.
   */
  const tint =
    item.kind === 'pet' ? '#FA5C00'
    : item.kind === 'product' ? '#14B8A6'
    : '#0EA5A4'

  const glyph =
    item.kind === 'pet' ? PAW_PATH
    : item.kind === 'product' ? TAG_PATH
    : STORE_PATH

  // The price is the only label worth the width; everything else is a glyph.
  const text =
    item.kind === 'product' && item.price > 0 ? faPriceShort(item.price) : ''

  const key = `${tint}|${glyph}|${text}`
  const cached = iconCache.get(key)
  if (cached) return cached

  const W = text ? 62 : 34
  const H = 44

  const html = `
    <div role="img" aria-hidden="true" style="
      position:relative;width:${W}px;height:${H}px;
      filter:drop-shadow(0 3px 6px rgba(0,0,0,.35));
      will-change:transform;
    ">
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"
           style="position:absolute;inset:0">
        <path d="M${W / 2} ${H - 1}
                 C ${W / 2 - 3} ${H - 9}, 3 ${H - 16}, 3 ${H / 2 - 8}
                 A ${W / 2 - 3} ${W / 2 - 3} 0 1 1 ${W - 3} ${H / 2 - 8}
                 C ${W - 3} ${H - 16}, ${W / 2 + 3} ${H - 9}, ${W / 2} ${H - 1} Z"
              fill="${tint}" stroke="#fff" stroke-width="2"/>
      </svg>
      <div style="
        position:absolute;left:0;right:0;top:0;height:${H - 12}px;
        display:flex;align-items:center;justify-content:center;gap:4px;
        color:#fff;font:800 ${text ? 11 : 13}px/1 Vazirmatn,system-ui,sans-serif;
        padding:0 ${text ? 6 : 0}px;
      ">
        ${text ? `<span style="white-space:nowrap">${text}</span>` : `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="${glyph}"/>
        </svg>`}
      </div>
    </div>
  `

  const icon = L.divIcon({
    html,
    className: '',
    iconSize: [W, H],
    iconAnchor: [W / 2, H - 1],   // the teardrop's tip
  })
  iconCache.set(key, icon)
  return icon
}

/* Inline path data, so a marker needs no icon font and no extra request. */
const PAW_PATH = 'M12 13.5c-2.6 0-4.7 1.9-4.7 4.2 0 1.9 1.6 3.1 3.4 2.6 1-.3 1.6-.3 2.6 0 1.8.5 3.4-.7 3.4-2.6 0-2.3-2.1-4.2-4.7-4.2Zm-4.6-1.2c1-.4 1.6-1.6 1.3-2.7-.3-1.1-1.4-1.7-2.4-1.3-1 .4-1.6 1.6-1.3 2.7.3 1.1 1.4 1.7 2.4 1.3Zm9.2 0c-1-.4-1.6-1.6-1.3-2.7.3-1.1 1.4-1.7 2.4-1.3 1 .4 1.6 1.6 1.3 2.7-.3 1.1-1.4 1.7-2.4 1.3ZM9.4 8.1c.9 0 1.7-.9 1.7-2S10.3 4 9.4 4s-1.7.9-1.7 2 .8 2.1 1.7 2.1Zm5.2 0c.9 0 1.7-.9 1.7-2S15.5 4 14.6 4s-1.7.9-1.7 2 .8 2.1 1.7 2.1Z'
const TAG_PATH = 'M20.6 11.6 12 3H4v8l8.6 8.6a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8ZM7.5 8.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z'
const STORE_PATH = 'M4 10v9a1 1 0 0 0 1 1h4v-6h6v6h4a1 1 0 0 0 1-1v-9h-5V6a1 1 0 0 1 1-1h1.5a1 1 0 0 0 .9-1.4l-.8-1.7A1 1 0 0 0 16.3 1H7.7a1 1 0 0 0-.9.6l-.8 1.7A1 1 0 0 0 6.9 5H8a1 1 0 0 1 1 1v4H4Z'

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

/**
 * "You are here" — pulsing brand dot at the true origin coordinate.
 *
 * `keyboard: false` on its Marker (below) is what actually keeps it out of the
 * tab order; `role="presentation"` and `aria-hidden` tell assistive tech it is
 * decoration, which it is. It had none of that and arrived as a focusable
 * `role="button"` with no accessible name — a keyboard user tabbed onto it,
 * heard «button», and Enter or Space did nothing, because the Marker is
 * `interactive={false}`. A control that takes focus and cannot be operated is
 * worse than one that is absent.
 */
const originIcon = L.divIcon({
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: `<span role="presentation" aria-hidden="true" style="
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
  'out-of-region':
    'موقعیت برگشتی خارج از ایران است — VPN/پروکسی را خاموش کنید تا مکان واقعی‌تان پیدا شود',
  approximate:
    'موقعیت تقریبی بود (چند کیلومتر خطا) — برای دقت بیشتر GPS گوشی را روشن کنید یا محله را جستجو کنید',
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
      ) : status === 'insecure' || status === 'out-of-region' ? (
        <ShieldAlert className="size-4 text-destructive" />
      ) : (
        <Crosshair className={cn('size-4', status === 'active' ? 'text-primary' : 'text-muted-foreground')} />
      )}
      {locating
        ? 'در حال مکان‌یابی…'
        : status === 'insecure'
          ? 'نیازمند HTTPS'
          : status === 'out-of-region'
            ? 'خارج از ایران (VPN؟)'
            : status === 'approximate'
              ? 'موقعیت تقریبی'
              : 'مکان من'}
    </button>
  )
}

interface MapViewProps {
  listings: ListingWithDistance[]
  origin: GeoPoint
  /** Called when a marker pin is clicked. */
  onSelect: (id: string) => void
  /**
   * Called when a pin covering several listings is clicked, with all of them,
   * so the caller can offer the group instead of silently opening one.
   */
  onCluster?: (items: ListingWithDistance[]) => void
  className?: string
}

/** Listings sharing (almost) the same point — e.g. one shop's product rows. */
interface Cluster {
  lat: number
  lng: number
  /** Centre of the grid cell, used to pick which member the pin sits on. */
  cellLat: number
  cellLng: number
  items: ListingWithDistance[]
}

/**
 * Only the listings the current viewport can show.
 *
 * The map holds the whole 10 km result set — 447 shops — while a zoomed-in
 * screen covers a few hundred metres. Clustering all of them put most pins
 * outside the canvas: measured at max zoom, 86 pins drawn and 85 of them off
 * screen, so the user saw one location dot and an empty map however far they
 * zoomed. The pins were there; they were somewhere else.
 *
 * Bounds are padded by half a screen so a pin arrives before it is needed and
 * dragging does not pop them in at the edge.
 */
function inView(listings: ListingWithDistance[], bounds: L.LatLngBounds): ListingWithDistance[] {
  const pad = 0.5
  const latSpan = bounds.getNorth() - bounds.getSouth()
  const lngSpan = bounds.getEast() - bounds.getWest()
  const south = bounds.getSouth() - latSpan * pad
  const north = bounds.getNorth() + latSpan * pad
  const west = bounds.getWest() - lngSpan * pad
  const east = bounds.getEast() + lngSpan * pad
  return listings.filter((l) => {
    const { lat, lng } = l.location
    return lat >= south && lat <= north && lng >= west && lng <= east
  })
}

/**
 * How many pins may be drawn at once.
 *
 * This is the bound that replaced the cell-size floor, and it only bites at
 * city zoom, where many listings share a cell and the groups are large. Once
 * the viewport filter is in place a wide view still holds the whole city, so
 * the cap stays — but it drops the smallest groups rather than merging
 * unrelated ones, and the count it hides is bounded by `MAX_PINS` itself.
 */
const MAX_PINS = 140

/**
 * Grid clustering sized to the current zoom.
 *
 * A shop's products inherit its exact coordinates, so one supermarket's 299
 * rows collapsed to a single point — good. The neighbouring shops, however,
 * were 30–200 m apart and each drew its own full-size pin, and at city zoom
 * 299 orange bubbles plus every shop pin buried the map under itself: the
 * screenshot of «خوراک و خوراکی» was unreadable.
 *
 * The cell is therefore ~80 px on screen, computed from the current zoom, so
 * whatever is visually adjacent merges and what is visually separate stays
 * apart. Panning and zooming re-cluster, which is what makes the map legible
 * at every scale instead of only when zoomed in.
 */
function clusterListings(
  listings: ListingWithDistance[],
  zoom: number,
): Cluster[] {
  // degrees per pixel at this latitude and zoom (Web Mercator)
  const CELL_PX = 80
  const cellDeg = (156543.03392 * Math.cos((35.7 * Math.PI) / 180)) /
    (2 ** zoom * CELL_PX)

  /* No floor on the cell size.
   *
   * There used to be one: `minDeg = 0.0102`, meant to stop a zoomed-out city
   * from becoming a sheet of orange. But it is a FLOOR, so it also applied at
   * maximum zoom, where it is backwards — the cell stopped shrinking while the
   * map kept growing. Measured: at zoom 18 the cell covered 135px of a screen
   * that had 80px of ground per cell, and at 19 it covered 269px. Pins that
   * sat in one cell could never separate no matter how far the user zoomed, so
   * a cluster stayed a cluster forever — «هرچه زوم می‌کنی بهش نمی‌رسی».
   *
   * The bound the floor was protecting is still needed, but it belongs where
   * the count is: cell size stays honest at every zoom, and the number of
   * bubbles is capped by `MAX_PINS` at render time, dropping the smallest
   * groups rather than merging unrelated ones. */
  const step = cellDeg

  const grid = new Map<string, Cluster>()
  for (const item of listings) {
    const key = `${Math.round(item.location.lat / step)}|${Math.round(
      item.location.lng / step,
    )}`
    const at = grid.get(key)
    if (at) {
      at.items.push(item)
      /* The pin sits on a REAL member, not on the cell's mean.
       *
       * The mean pulled the bubble off every actual shop: a cell spanning
       * 1.1 km put its centre in a gap between streets, and the more the map
       * zoomed the further that invented point drifted from the listings it
       * stood for. Measured at max zoom: 86 pins rendered, 85 of them outside
       * the viewport, so the map showed one grey location dot and nothing
       * else — «هرچه زوم می‌کنی بهش نمی‌رسی».
       *
       * Keeping the member whose position is closest to the cell centre means
       * the pin always sits where a listing actually is, and clicking it opens
       * something that exists.
       */
      const curD = (at.lat - at.cellLat) ** 2 + (at.lng - at.cellLng) ** 2
      const newD = (item.location.lat - at.cellLat) ** 2 +
                   (item.location.lng - at.cellLng) ** 2
      if (newD < curD) {
        at.lat = item.location.lat
        at.lng = item.location.lng
      }
    } else {
      grid.set(key, {
        cellLat: (Math.round(item.location.lat / step) + 0.5) * step,
        cellLng: (Math.round(item.location.lng / step) + 0.5) * step,
        lat: item.location.lat,
        lng: item.location.lng,
        items: [item],
      })
    }
  }
  /* Largest groups first, then cap.
   *
   * Ordering by count rather than by position keeps the decision stable while
   * panning: an alphabetical or insertion-order cut would make pins flicker in
   * and out as the user drags. Groups of one go last, so at a busy zoom the
   * map keeps the dense cells and drops the singletons. */
  const all = [...grid.values()]
  if (all.length <= MAX_PINS) return all
  return all
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, MAX_PINS)
}

/**
 * Pin for a point carrying several listings.
 *
 * One disc, one number, and a ring that carries how many places it stands for.
 *
 * What it was: a gradient ball with a paw drawn INSIDE it, and the count on a
 * dark chip hanging off the bottom edge — two shapes stacked, the number
 * half-overlapping the circle. Next to the old white pills the whole map read
 * as debris rather than as places, and the count was the smaller of the two
 * things on a pin whose only job is the count.
 *
 * The pip ring around the edge says "several" without competing with the
 * number, and the fill stays one flat brand orange so a cluster and a single
 * pin read as the same family.
 */
const clusterCache = new Map<number, L.DivIcon>()

function clusterIcon(count: number): L.DivIcon {
  const cached = clusterCache.get(count)
  if (cached) return cached

  // Grows with the count so «۹۹» visibly outweighs «۳», but flat-topped: past
  // three digits the ring is already unambiguous and a bigger disc only
  // covers more of the street it sits on.
  const size = Math.min(52, 34 + Math.log10(count) * 12)
  const fontSize = count > 99 ? 12 : count > 9 ? 14 : 15

  const html = `
    <div style="
      position:relative;width:${size}px;height:${size}px;
      display:grid;place-items:center;
      border-radius:999px;
      background:#FA5C00;
      border:3px solid rgba(255,255,255,.96);
      box-shadow:0 4px 14px rgba(226,71,0,.45);
      color:#fff;
      font:800 ${fontSize}px/1 Vazirmatn,system-ui,sans-serif;
      font-variant-numeric:tabular-nums;
      will-change:transform;
    ">${faDigits(count)}</div>`

  const icon = L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
  clusterCache.set(count, icon)
  return icon
}

/**
 * Listing markers as ONE imperative Leaflet layer instead of one React
 * <Marker> per listing.
 *
 * With 200+ results the per-marker component approach cost a React subtree,
 * an effect and an icon rebuild for every pin — visible as sluggish panning,
 * because the marker pane is re-laid-out on each frame. A LayerGroup lets
 * Leaflet own the markers directly: we only touch the DOM when the result set
 * actually changes, and pan/zoom stay inside Leaflet's own transform path.
 */
function ListingMarkers({
  listings,
  onSelect,
  onCluster,
}: {
  listings: ListingWithDistance[]
  onSelect: (id: string) => void
  onCluster?: (items: ListingWithDistance[]) => void
}) {
  const map = useMap()
  // onSelect is re-created on every parent render; keep the latest in a ref so
  // marker handlers are bound once instead of on every listing change.
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect
  const clusterRef = useRef(onCluster)
  clusterRef.current = onCluster

  /* One counter, bumped when either the zoom or the visible box changes.
   *
   * Before this, only `zoomend` rebuilt the layer, so panning kept the pins of
   * wherever the user had been — and because clustering used the whole result
   * set rather than the visible part, most of those pins were off screen. The
   * map looked empty at high zoom while holding 86 markers.
   *
   * `moveend` covers the pan; debounced because Leaflet fires both during a
   * pinch or a wheel run. */
  const [view, setView] = useState(0)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const bump = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setView((v) => v + 1), 160)
    }
    map.on('zoomend', bump)
    map.on('moveend', bump)
    return () => {
      clearTimeout(timer)
      map.off('zoomend', bump)
      map.off('moveend', bump)
    }
  }, [map])

  // `view` is a rebuild trigger, not a value read below — referencing it in the
  // dependency list is the point.
  useEffect(() => {
    const layer = L.layerGroup().addTo(map)

    /* Read the box once, before creating anything.
     *
     * `getBounds()` reads the map's live state rather than the frame this
     * effect was scheduled from, so calling it inside the loop would let a
     * still-settling pan filter different pins against different boxes. One
     * read is also the honest one: the pins drawn are then all judged against
     * the same view.
     *
     * The 50% padding in `inView` is deliberate and does show pins above and
     * below the canvas edge — measured after a full zoom, one shop sat 280px
     * above an 836px map and was still correct: it opens a real shop 339m
     * away. They arrive before the user drags to them; they are not phantom. */
    const visible = inView(listings, map.getBounds())

    for (const cluster of clusterListings(visible, map.getZoom())) {
      const clustered = cluster.items.length > 1
      const icon = clustered
        ? clusterIcon(cluster.items.length)
        : markerIcon(cluster.items[0])
      const open = () => {
        // A cluster stands for several listings. Opening an arbitrary one
        // made the other four unreachable, so the parent is asked to offer
        // the whole group instead.
        if (clustered && clusterRef.current) {
          clusterRef.current(cluster.items)
        } else {
          selectRef.current(cluster.items[0].id)
        }
      }

      const marker = L.marker([cluster.lat, cluster.lng], {
        icon,
        riseOnHover: true,
        /* These were `keyboard: false`, which took every listing pin out of the
           tab order — a keyboard or screen-reader user could not open a listing
           from the map at all, though a mouse could.

           The obvious worry is tab order: 200+ pins would mean 200+ tabs before
           the reader gets past the map. It does not apply here because
           clustering bounds the rendered pins — measured at 3 at the default
           zoom, and one cell means one pin whatever the city holds.

           `keyboard: true` alone is NOT enough, which is worth knowing before
           trusting it. Leaflet's _initIcon only does:

             if (options.keyboard) { icon.tabIndex = '0'; icon.setAttribute('role', 'button') }

           — it makes the marker focusable and stops there. Nothing in Leaflet
           binds Enter or Space for a marker, so a focused pin announced itself
           as a button and did nothing when pressed. The key handler below is
           ours for that reason, not redundancy. */
        keyboard: true,
        /* `title`, not `alt`. Leaflet writes `alt` onto an `<img>`
           (`icon.alt = options.alt` in _initIcon) and a divIcon has no image,
           so the option is silently dropped — measured: the marker came out
           with no name at all. `title` goes onto the div itself, which gives
           both the hover tooltip and the accessible name for a divIcon. */
        title: clustered
          ? `${faDigits(cluster.items.length)} مورد در این محدوده`
          : markerLabel(cluster.items[0]),
      })

      marker.on('click', open)

      /* Leaflet puts these markers in the tab order but gives them no way to be
         operated. Enter and Space are what a button is expected to answer to,
         and the map's own key handling does not cover a focused marker. */
      marker.on('add', () => {
        const el = marker.getElement()
        if (!el) return
        /* Leaflet puts `title` on the wrapper, but the visible label («۶۲۸»)
           is a child of it, so a screen reader announces both and the price
           alone says nothing. aria-label replaces the computed name outright
           with the full sentence. */
        el.setAttribute('aria-label', clustered
          ? `${faDigits(cluster.items.length)} مورد در این محدوده`
          : markerLabel(cluster.items[0]))
        el.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault()   // Space would otherwise scroll the map
            open()
          }
        })
      })

      marker.addTo(layer)
    }

    return () => {
      layer.remove()
    }
  }, [map, listings, view])

  return null
}

/**
 * Interactive geospatial pane (Iranian market default: Tehran).
 * Tiles: keyless OSM, dark mode via CSS invert (see index.css).
 * Container is `isolate-map` wrapped so Leaflet's internal z-indexes can
 * never paint over the z-nav navbar.
 */
export function MapView({
  listings,
  origin,
  onSelect,
  onCluster,
  className,
}: MapViewProps) {
  const theme = useUiStore((s) => s.theme)

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
          // Panning re-requests tiles constantly; keeping them cached stops the
          // slow, blank-tile feeling on repeat drags over the same area.
          keepBuffer={4}
        />
        <MapSync origin={origin} />

        {/* `keyboard: false` is what keeps this out of the tab order — it is a
            passive "you are here" dot, not a control. Without it Leaflet still
            gave it tabindex="0" and role="button", so a keyboard user could
            focus something that did nothing when pressed. */}
        <Marker
          position={[origin.lat, origin.lng]}
          icon={originIcon}
          interactive={false}
          keyboard={false}
          zIndexOffset={1000}
        />

        <ListingMarkers listings={listings} onSelect={onSelect} onCluster={onCluster} />
      </MapContainer>

      {/* «مکان من» — re-center on the real GPS position */}
      <MyLocationButton />
    </div>
  )
}
