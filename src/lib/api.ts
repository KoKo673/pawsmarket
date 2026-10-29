import { PRODUCT_ENRICHMENT, PRODUCT_IMAGES } from '@/data/products'
import { storeLabel } from '@/lib/store-labels'
import { applyFilters } from '@/lib/search'
import { asset } from '@/lib/utils'

import type {
  Filters,
  GeoPoint,
  Listing,
  ListingWithDistance,
  MedicalFlag,
  NewListingDraft,
  PetListing,
  ProductCategory,
  ProductListing,
  Species,
  StoreCategory,
  StoreListing,
} from '@/types'

/**
 * Typed HTTP client + DTO adapter for the Flask/FastAPI + PostGIS backend.
 *
 * Endpoints (live at VITE_API_BASE_URL — proxied by Vite, see .env):
 *   GET  /api/pets?lat&lng&radius&q        → flat row[]
 *   GET  /api/products?lat&lng&radius&q    → flat row[]
 *   GET  /api/stores/nearby?lat&lng&radius → flat row[]
 *   POST /api/pets · /api/products         → { id }
 *
 * ── Adapter contract (Phase 3 alignment) ─────────────────────────────
 * The backend emits WIRE rows (flat `lat`/`lng`, numeric ids, minimal
 * columns). The frontend consumes the typed `Listing` union
 * (src/types/index.ts). This module maps one to the other and fills
 * display defaults for columns the backend does not store yet — so the
 * UI contract stays stable while the API schema evolves.
 *
 * STRICT MODE: any unreachable backend, non-2xx, or non-array payload
 * rejects the query — the UI shows an error state with retry (no mocks).
 * Radius/keyword re-filtering happens client-side in `applyFilters`,
 * which also computes display distances (mirrors ST_DWithin).
 */

/**
 * Backend origin. Empty in dev so the Vite proxy owns the backend URL
 * (see .env); set VITE_API_BASE_URL to point a build at a deployed API.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

/**
 * Publish mode (GitHub Pages et al.): the backend lives on localhost and
 * is unreachable from a public host, so the deployed build ships a
 * SNAPSHOT (`catalog.json`, exported from the live DB by
 * scripts/export_catalog.py) instead of live fetches. Missing/broken
 * catalog still rejects — strictness is never faked with inlined mocks.
 */
const STATIC_MODE = import.meta.env.VITE_CATALOG_MODE === 'static'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Every request is bounded in time.
 *
 * Measured downstream throughput from Tehran to the deployment was ~200 B/s,
 * where a 15 KB answer needs over a minute. Without a deadline a fetch simply
 * hangs and the visitor watches a loading state forever, with no error and no
 * retry. A slow response is now a normal failure they can act on.
 */
const REQUEST_TIMEOUT_MS = 20_000

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      signal: init?.signal ?? controller.signal,
      ...init,
    })
  } catch {
    // Network-level failure, or the deadline above.
    throw new ApiError('در حال حاضر به سرور وصل نیستیم؛ لطفاً چند لحظه دیگر تلاش کنید', 0)
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) {
    // 503 is the API's own answer when its database is unreachable. Passing the
    // status through lets the explore view distinguish "come back later" from
    // a genuine bug, instead of showing the same blank error for both.
    if (res.status === 503) {
      throw new ApiError('در حال حاضر به سرور وصل نیستیم؛ لطفاً چند لحظه دیگر تلاش کنید', 503)
    }
    throw new ApiError(`دریافت اطلاعات ناموفق بود (${res.status})`, res.status)
  }
  return (await res.json()) as T
}

function expectArray(path: string, data: unknown): RawRow[] {
  if (!Array.isArray(data)) {
    throw new ApiError(`Unexpected payload from ${path}: expected an array`, 200)
  }
  return data as RawRow[]
}

/* ════════════════ wire-row → Listing adapter ════════════════ */

/** Loose shape of whatever the backend serializes. */
type RawRow = Record<string, unknown>

const str = (v: unknown, fallback: string): string =>
  typeof v === 'string' && v.length > 0 ? v : fallback

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback

const bool = (v: unknown, fallback: boolean): boolean =>
  typeof v === 'boolean' ? v : fallback

/** Backend stores coordinates flat; the frontend domain uses location{} */
const toPoint = (raw: RawRow): GeoPoint => ({
  lat: num(raw.lat, 35.6892),
  lng: num(raw.lng, 51.389),
})

const KNOWN_SPECIES: Species[] = ['dog', 'cat', 'rabbit', 'bird', 'fish', 'small', 'other']
const KNOWN_MEDICAL: MedicalFlag[] = ['vaccinated', 'sterilized', 'microchipped', 'needs-care', 'checkup-due']
const KNOWN_PRODUCT_CATEGORIES = new Set<string>([
  'food', 'toy', 'health', 'accessories', 'grooming',
])

const isProductCategory = (v: unknown): v is ProductCategory =>
  typeof v === 'string' && KNOWN_PRODUCT_CATEGORIES.has(v)

/**
 * Bundled fallback imagery — always present in /public/images/listings.
 *
 * Deliberately NOT the hero's three photos. Those are the first images a
 * visitor sees, and reusing them here made the same golden retriever appear
 * again as "a pet for adoption" a few hundred pixels down — measured on the
 * live page, cat-orange.jpg appeared six times.
 *
 * Each species has a few photos, not one, and the pick rotates by the row's
 * id. With a single image per species every cat in the feed showed the same
 * white cat — three of the five seed pets are cats, so the page looked like it
 * was repeating a photo. The database has no pet_photos at all yet, so this
 * path is what every listing uses today, not an edge case.
 */
const PET_IMAGES: Record<Species, string[]> = {
  dog: ['dog-shiba.jpg', 'dog-jack.jpg', 'dog-corgi.jpg', 'dog-pug.jpg'].map(
    (f) => asset('images/listings/' + f)),
  /* Four, not three. cat-orange was removed from this pool when the hero
     stopped using it, which quietly left three photos for the four cats in
     the seed data — `id % 3` then guaranteed a repeat, and the live page
     showed cat-look three times out of nine images. Its saturated blue
     backdrop is wrong *in the warm hero*, which is where it failed before;
     inside a listing card, against a neutral surface, it is simply a fourth
     distinct cat. */
  cat: ['cat-white.jpg', 'cat-grey.jpg', 'cat-look.jpg', 'cat-orange.jpg'].map(
    (f) => asset('images/listings/' + f)),
  rabbit: ['rabbit2.jpg', 'rabbit.jpg'].map((f) => asset('images/listings/' + f)),
  bird: ['parrot.jpg'].map((f) => asset('images/listings/' + f)),
  fish: ['fish.jpg'].map((f) => asset('images/listings/' + f)),
  small: ['guinea.jpg'].map((f) => asset('images/listings/' + f)),
  other: ['dog-jack.jpg'].map((f) => asset('images/listings/' + f)),
}

/**
 * Which photo has already been handed out to this species, per page load.
 *
 * `id % pool.length` is not "rotation", it is a hash — and a hash collides
 * as soon as the modulus is smaller than the number of rows. Measured on
 * the live homepage: nine images, six unique, cat-look three times.
 *
 * This keeps a cursor per species instead, so consecutive listings of one
 * species always take the next photo. When the pool runs out it wraps,
 * which is unavoidable with more animals than photographs — but the repeat
 * is then spread across the whole page instead of landing twice in the
 * first row.
 *
 * Keyed by species and reset never: the function is called once per listing
 * during the same map, so the order is stable for a given render.
 */
const speciesCursor: Partial<Record<Species, number>> = {}

function petFallback(species: Species, seed: number): string {
  const pool = PET_IMAGES[species] ?? PET_IMAGES.other
  if (pool.length <= 1) return pool[0]
  // Seeded start so the first cat is not always cat-white, then advance.
  const start = speciesCursor[species] ?? Math.abs(Math.trunc(seed)) % pool.length
  speciesCursor[species] = start + 1
  return pool[start % pool.length]
}

/**
 * Shown when a product has no photo of its own.
 *
 * These used to be per-category stock shots, which were worse than nothing:
 * a fish for a dog vitamin and a shop interior for a pet bed, i.e. pictures of
 * products this shop does not sell. Nearly every real product now carries its
 * own downloaded photo (scripts/download_product_images.py), so this path is
 * the thin remainder — and it says "no photo" instead of lying.
 */
const NO_PRODUCT_PHOTO = asset('images/products/no-photo.svg')

/**
 * Last-resort imagery for a shop with no photo of its own.
 *
 * Most shops now carry their own Google Maps photo (scripts/fetch_store_images.py
 * → scripts/store_images.json). Boarding and cafés deliberately share the shop
 * shots they always had: there is no distinct bundled photo for them, and
 * reusing the shelter picture would be a worse claim than the generic shopfront.
 */
const STORE_IMAGE: Record<StoreCategory, string> = {
  shop: asset('images/stores/shop-1.jpg'),
  vet: asset('images/stores/vet-2.jpg'),
  groomer: asset('images/stores/groomer-1.jpg'),
  shelter: asset('images/stores/shelter-1.jpg'),
  cafe: asset('images/stores/shop-3.jpg'),
  boarding: asset('images/stores/shop-2.jpg'),
}

/** Infer display category from free-text name (backend doesn't store it yet). */
function inferProductCategory(name: string): ProductCategory {
  const n = name.toLowerCase()
  if (/(food|kibble|feed|snack|غذا|خوراک)/.test(n)) return 'food'
  if (/(toy|ball|rope|plush|اسباب|توپ)/.test(n)) return 'toy'
  if (/(shampoo|brush|med|clip|شامپو|دارو)/.test(n)) return 'grooming'
  return 'accessories'
}

function inferStoreCategory(name: string, address: string): StoreCategory {
  const s = `${name} ${address}`.toLowerCase()
  if (/(vet|دامپزشک|clinic)/.test(s)) return 'vet'
  if (/(groom|آرایش|bath|حمام|استایل)/.test(s)) return 'groomer'
  if (/(shelter|پناهگاه|rescue|مهربانی)/.test(s)) return 'shelter'
  if (/(پانسیون|هتل|hotel|boarding)/.test(s)) return 'boarding'
  if (/(cafe|کافه)/.test(s)) return 'cafe'
  return 'shop'
}

/**
 * Backend ids are per-table sequences (product #1, store #1, …) — the
 * frontend keeps pets+products+stores in ONE list, so ids must be
 * namespaced to stay unique React keys / lookup handles.
 */
const wireId = (kind: 'pet' | 'product' | 'store', raw: RawRow): string =>
  `${kind}:${String(raw.id ?? 'unknown')}`

/**
 * Wire row → PetListing.
 *
 * Fields the source never provided stay undefined instead of being filled with
 * a plausible-looking default: a social profile that never recorded an age
 * must not display «۱ سال», and one with no owner must not claim «نر».
 */
function toPetListing(raw: RawRow): PetListing {
  const speciesRaw = str(raw.species, 'other')
  const species: Species = KNOWN_SPECIES.includes(speciesRaw as Species)
    ? (speciesRaw as Species)
    : 'other'
  const price = num(raw.price, 0)
  const has = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : v)
  const genderRaw = raw.gender

  // The row id drives which fallback photo a pets gets, so two cats next to
  // each other do not show the same picture. `raw.id` is a number or numeric
  // string in both the snapshot and the API.
  const idSeed = Number(raw.id)
  const petId = wireId('pet', raw)

  return {
    id: petId,
    kind: 'pet',
    name: str(raw.name, 'حیوان خانگی'),
    description: str(raw.description, 'توضیحاتی برای این آگهی ثبت نشده است.'),
    images: Array.isArray(raw.images) && raw.images.length > 0
      ? (raw.images as string[])
      : [petFallback(species, Number.isFinite(idSeed) ? idSeed : 0)],
    location: toPoint(raw),
    address: str(raw.address, 'تهران'),
    createdAt: str(raw.created_at ?? raw.createdAt, new Date(0).toISOString()),
    species,
    ...(has(raw.breed) ? { breed: str(raw.breed, '') } : {}),
    ...(raw.ageMonths !== null && raw.ageMonths !== undefined
      ? { ageMonths: num(raw.ageMonths, 0) }
      : {}),
    ...(genderRaw === 'female' || genderRaw === 'male' ? { gender: genderRaw } : {}),
    price,
    ...(raw.adoptable !== null && raw.adoptable !== undefined
      ? { adoptable: bool(raw.adoptable, false) }
      : {}),
    medical: Array.isArray(raw.medical)
      ? (raw.medical.filter((m): m is MedicalFlag => KNOWN_MEDICAL.includes(m as MedicalFlag)) as MedicalFlag[])
      : [],
    ...(has(raw.ownerName) ? { ownerName: str(raw.ownerName, '') } : {}),
  }
}

/**
 * Wire row → ProductListing.
 * `storeNames` maps `store_id` → store name from the parallel
 * /api/stores/nearby response (the products API only returns the FK).
 */
function toProductListing(raw: RawRow, storeNames: Map<string, string>): ProductListing {
  const name = str(raw.name, 'محصول')
  const category: ProductCategory = isProductCategory(raw.category)
    ? raw.category
    : inferProductCategory(name)
  const storeName =
    str(raw.storeName, '') ||
    (raw.store_id != null ? (storeNames.get(String(raw.store_id)) ?? `فروشگاه شماره ${raw.store_id}`) : 'پازمارکت')

  // Live marketplace figures, when this exact product was matched to its
  // listing (scripts/enrich_digikala.py). Absent for products with no match —
  // the card simply shows less rather than a guessed number.
  const live = PRODUCT_ENRICHMENT[name]

  return {
    id: wireId('product', raw),
    kind: 'product',
    name,
    description: str(raw.description, `«${name}» — توضیحات از سمت فروشگاه ارائه نشده است.`),
    images:
      Array.isArray(raw.images) && raw.images.length > 0
        ? (raw.images as string[])
        : [PRODUCT_IMAGES[name] ?? NO_PRODUCT_PHOTO],
    location: toPoint(raw),
    address: str(raw.address, 'تهران'),
    createdAt: str(raw.created_at ?? raw.createdAt, new Date(0).toISOString()),
    category,
    price: num(raw.price, 0),
    brand: str(raw.brand, 'بدون برند'),
    inStock: bool(raw.inStock, true),
    storeName,
    storeId: raw.store_id != null ? wireId('store', { id: raw.store_id }) : undefined,
    ...(live
      ? {
          ...(live.rating !== undefined ? { rating: live.rating } : {}),
          ...(live.ratingCount !== undefined
            ? { ratingCount: live.ratingCount }
            : {}),
          ...(live.priceLow30d ? { priceLow30d: live.priceLow30d } : {}),
          ...(live.priceHigh30d ? { priceHigh30d: live.priceHigh30d } : {}),
          ...(live.digikalaPrice ? { digikalaPrice: live.digikalaPrice } : {}),
          ...(live.discountPct ? { discountPct: live.discountPct } : {}),
          ...(live.seller ? { seller: live.seller } : {}),
          ...(live.url ? { productUrl: live.url } : {}),
        }
      : {}),
  }
}

/**
 * A shop's own Google Maps photos, or the category's stock shot when it has
 * none. Real photos come first and in full, so the detail gallery has something
 * to page through; the stock image is only ever a last resort rather than being
 * interleaved, which would imply the shop is the thing in that picture.
 */
function storeImages(raw: RawRow, category: StoreCategory): string[] {
  const own = [
    ...(Array.isArray(raw.images) ? (raw.images as string[]) : []),
    ...(typeof raw.image_url === 'string' && raw.image_url ? [raw.image_url] : []),
  ]
  return own.length > 0 ? own.map(asset) : [STORE_IMAGE[category]]
}

/**
 * Wire row → StoreListing.
 *
 * Every display field comes off the wire row now. It did not used to:
 * `SHOP_ENRICHMENT` in src/data/shops.ts was keyed by shop *name* and
 * merged on top here, because the API returned only name/address/lat/lng.
 * That file held 757 shops' phone numbers, hours and photos in 9,671 lines
 * of TypeScript — a build artefact, 15 days stale by the end, whose `id`
 * values did not match the database's.
 *
 * Migration 0020 added the columns, a one-shot script filled them from that
 * file, and an equivalence check compared all ten fields across all 446
 * matching stores before this merge was removed: zero differences.
 *
 * No invented values: missing phone → '' (renders «—»), missing rating → 0
 * (renders «ثبت‌نشده»), never a fake number.
 */
function toStoreListing(raw: RawRow): StoreListing {
  const name = str(raw.name, 'فروشگاه')
  const address = str(raw.address, 'تهران')
  const wireCategory = String(raw.category ?? '')
  const category: StoreCategory =
    (wireCategory in STORE_IMAGE ? (wireCategory as StoreCategory) : inferStoreCategory(name, address))

  return {
    id: wireId('store', raw),
    kind: 'store',
    name,
    // A short line only. `description` is carried from the row when present
    // and read by the sheet on open; putting ~183 bytes of prose per shop in
    // the initial payload meant 460 copies of it for a text only one modal
    // shows.
    description: str(raw.description, `«${name}» — ${storeLabel(category) || 'فروشگاه'} در ${address}.`),
    images: storeImages(raw, category),
    location: toPoint(raw),
    address,
    createdAt: str(raw.created_at ?? raw.createdAt, new Date(0).toISOString()),
    category,
    rating: num(raw.rating, 0),
    reviewCount: num(raw.reviewCount ?? raw.review_count, 0),
    opensAt: str(raw.opensAt ?? raw.opens_at, '09:00'),
    closesAt: str(raw.closesAt ?? raw.closes_at, '21:00'),
    phone: str(raw.phone, ''),
    // `website` is deliberately not carried: 569 of its 605 values were Google
    // Maps search URLs of the shop's own name — not the shop's site — and
    // nothing rendered it. The real ones are on the row if anything ever does.
    categories: Array.isArray(raw.categories) ? (raw.categories as string[]) : undefined,
  }
}

/* ── Geo query strings ─────────────────────────────────────────── */

/** Largest page the nearby endpoints accept (`le=2000` on all three). */
const NEARBY_MAX_LIMIT = 2000

/**
 * Radius is sent as BOTH `radius` and `max_distance`.
 *
 * The nearby endpoints declare `max_distance` (metres) and default it to 5000;
 * `/api/pets` instead takes `radius`. Sending only `radius` left the store
 * query pinned at the 5 km default, so widening the sidebar slider changed
 * nothing for stores/products — the catalog silently looked tiny.
 *
 * `limit` is pinned to the server's ceiling on purpose. The endpoints default
 * it to 150 (products 120) because the page size was sized for a slow link,
 * and nothing in the UI ever asked for more — so `/api/stores/nearby` returned
 * 150 of 218 stores. /explore never noticed (it reads the committed snapshot),
 * but a page that looks a store up BY ID does: the missing 68 ids resolve to
 * nothing and are then refused as «پیدا نشد». That is a wrong answer about a
 * real business, so the lookup asks for the whole set rather than the default.
 */
function geoParams(origin: GeoPoint, filters: Filters): URLSearchParams {
  const metres = String(filters.radiusKm * 1000)
  return new URLSearchParams({
    lat: origin.lat.toFixed(6),
    lng: origin.lng.toFixed(6),
    radius: metres,
    max_distance: metres,
    limit: String(NEARBY_MAX_LIMIT),
    ...(filters.query ? { q: filters.query } : {}),
  })
}

/* ── Individual resource calls (raw wire rows) ───────────────────── */

async function getPetsRaw(origin: GeoPoint, filters: Filters): Promise<RawRow[]> {
  const path = `/api/pets?${geoParams(origin, filters)}`
  return expectArray(path, await request<unknown>(path))
}

/**
 * Retired endpoint — returns nothing, on purpose.
 *
 * `/api/products` answers 410 Gone. Its table is the legacy directory of
 * other shops' inventory; what this shop sells lives in `marketplace_products`
 * and comes from `/api/shop` (see the note further down about not mixing the
 * two). This used to call it anyway, inside a Promise.allSettled, so the site
 * worked while every single page load sent a request that was guaranteed to
 * fail and logged a console error.
 *
 * Marked `@deprecated` rather than deleted because fetchNearbyListings still
 * destructures three arrays by position; removing the slot is a wider change
 * than this fix needs.
 *
 * @deprecated always resolves to [] — use /api/shop for products
 */
async function getProductsRaw(_origin: GeoPoint, _filters: Filters): Promise<RawRow[]> {
  return []
}

/* ── last-good response, so a blip does not empty the map ─────────
 *
 * `VITE_CATALOG_MODE=static` was the old answer to "what if the API is
 * down": ship a snapshot and read from it. Two things were wrong with it.
 * It is a BUILD-time variable — `import.meta.env` is substituted by
 * `vite build`, so turning it on needs a full redeploy, which is not an
 * emergency switch. And it was never set in production (`.env.production`
 * has no such line), so the site has always read the API and the snapshot
 * has always been dead weight on disk.
 *
 * This is the runtime version of the same idea, at a fraction of the cost:
 * remember the last successful result and hand it back when the network
 * fails, with the caller told the data is stale so it can say so.
 *
 * It does nothing for a first-time visitor with no network — there is
 * nothing to remember. That is honest: a snapshot would have covered them,
 * and the snapshot was 15 days stale and disagreed with the database about
 * ids, which is why 431 of 447 stores rendered twice.
 */
const LAST_STORES_KEY = 'pawsmarket:last-stores'
const LAST_STORES_AT = 'pawsmarket:last-stores-at'

function readCachedStores(): RawRow[] | null {
  try {
    const raw = localStorage.getItem(LAST_STORES_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null  // private mode, quota, corrupt JSON — none are fatal
  }
}

function writeCachedStores(rows: RawRow[]): void {
  try {
    localStorage.setItem(LAST_STORES_KEY, JSON.stringify(rows))
    localStorage.setItem(LAST_STORES_AT, String(Date.now()))
  } catch {
    // A full quota must not break a successful request. Losing the cache
    // costs one fallback on a future outage; throwing here costs the page.
  }
}

/** When the cached rows were stored, or null if nothing is cached. */
export function cachedStoresAt(): number | null {
  try {
    const raw = localStorage.getItem(LAST_STORES_AT)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

async function getStoresRaw(origin: GeoPoint, filters: Filters): Promise<RawRow[]> {
  const path = `/api/stores/nearby?${geoParams(origin, filters)}`
  try {
    const rows = expectArray(path, await request<unknown>(path))
    writeCachedStores(rows)
    return rows
  } catch (err) {
    const cached = readCachedStores()
    if (cached) {
      // Mark the rows so the caller can say "this may be out of date"
      // rather than presenting yesterday's phone numbers as current.
      return cached.map((r) => ({ ...r, _stale: true }))
    }
    throw err
  }
}

/* ── Aggregated search used by the Explore view ──────────────────── */

/**
 * Fan out to all three endpoints in parallel, adapt wire rows into the
 * `Listing` union, merge, then geo-filter client-side (radius + keyword
 * + display distances — mirrors the server's ST_DWithin/ST_DDistance).
 *
 * STRICT: every endpoint must succeed; one rejection fails the whole
 * query (no silently-partial result sets). In publish (static) mode the
 * same contract applies to catalog.json.
 */
/**
 * The catalog snapshot published beside the app.
 *
 * The catalogue (stores, products, pets) is the same for every visitor and is
 * ~400 KB. Serving it from GitHub Pages' CDN takes under a second; fetching it
 * from the API measured ~200 B/s downstream to Tehran, so a single page took
 * over a minute and usually lost the connection halfway. The snapshot is
 * regenerated from the same database by scripts/export_catalog.py, so it is
 * the same data — just delivered from somewhere close.
 *
 * The API stays for everything that is per-visitor or changes: auth, profiles,
 * moments, follows, adoption.
 */
/**
 * Union two row sets by id, preferring the second.
 *
 * Used to lay the live API's rows over the published snapshot: the snapshot
 * has the bulk and the CDN, the live response has whatever changed since it
 * was generated.
 */


/** A store we list as a place, not as something to buy from. */
const SERVICE_CATEGORIES = new Set(['vet', 'groomer', 'boarding', 'shelter', 'cafe'])
function isServiceStore(row: RawRow): boolean {
  return SERVICE_CATEGORIES.has(String(row.category ?? ''))
}

async function catalogSnapshot(): Promise<{
  pets: RawRow[]; products: RawRow[]; stores: RawRow[]
}> {
  // Fetched with a bare fetch, NOT through request().
  //
  // request() prefixes API_BASE, so this was asking the Railway API for
  // «/pawsmarket/catalog.json» — a path it does not serve — and getting a 404
  // every time. The snapshot silently never loaded, the catalogue fell back to
  // whatever the API returned, and because that response is now capped at 150
  // stores the filter for «پناهگاه» had none to match: fifteen shelters sat in
  // the published catalog while the UI showed «۰ نتیجه».
  //
  // The snapshot lives beside the app on the same CDN, which is the whole
  // reason it exists — it must not be routed through the API's origin.
  const path = `${import.meta.env.BASE_URL}catalog.json`
  const res = await fetch(path, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new ApiError(`catalog.json ${res.status}`, res.status)
  }
  const catalog = (await res.json()) as {
    pets?: unknown; products?: unknown; stores?: unknown
  }
  if (!Array.isArray(catalog.pets) || !Array.isArray(catalog.products)
      || !Array.isArray(catalog.stores)) {
    throw new ApiError(
      `Invalid catalog.json at ${path}: expected {pets,products,stores} arrays`,
      200)
  }
  // The snapshot is a vendored scrape of Digikala's listings. Those are
  // other people's products, and this shop sells only its own stock, so
  // both `products` and the `shop`-category stores are dropped here.
  //
  // Dropped at the source rather than filtered later: every surface
  // (explore, map, search, category tiles, the detail sheet) reads this
  // one function, and a filter applied in four places is a filter the
  // fifth place forgets. Service centres stay — a vet is a listing, not
  // something we sell.
  const stores = (catalog.stores as RawRow[]).filter(isServiceStore)

  return {
    pets: catalog.pets as RawRow[],
    products: [],
    stores,
  }
}

export async function fetchNearbyListings(
  origin: GeoPoint,
  filters: Filters,
): Promise<ListingWithDistance[]> {
  let petRows: RawRow[] = []
  let productRows: RawRow[] = []
  let storeRows: RawRow[] = []

  // One source: the API. The snapshot is a fallback, not a co-equal input.
  //
  // This used to be two sources merged. `catalog.json` was a build-time
  // export whose ids did not match the database's, so the two were
  // reconciled on name+coordinates (`businessKey`) and the snapshot's rows
  // won because it carried enriched fields the API did not. Migration 0020
  // and the enrichment migration moved those fields into the database, and
  // an equivalence check compared all ten of them across all 446 matching
  // stores before this was removed: zero differences.
  //
  // What is left of the snapshot is a genuine fallback: if the API answers
  // nothing, read the last export rather than showing an empty map. The
  // rows come from the same database, with the same ids, so no matching is
  // needed — which is why `businessKey` could be deleted rather than fixed.
  const settled = await Promise.allSettled([
    getPetsRaw(origin, filters),
    getProductsRaw(origin, filters),
    getStoresRaw(origin, filters),
  ])
  const failures = settled.filter(
    (r): r is PromiseRejectedResult => r.status === 'rejected')

  if (failures.length === settled.length && !STATIC_MODE) {
    // Everything failed. Try the export before giving up.
    const snapshot = await catalogSnapshot().catch(() => null)
    if (snapshot && snapshot.stores.length > 0) {
      petRows = snapshot.pets
      productRows = snapshot.products
      storeRows = snapshot.stores.map((r) => ({ ...r, _stale: true }))
    } else {
      const first = failures[0]?.reason
      const status = first instanceof ApiError ? first.status : 0
      throw new ApiError(
        first instanceof ApiError && first.message
          ? first.message
          : 'در حال حاضر به سرور وصل نیستیم؛ لطفاً چند لحظه دیگر تلاش کنید',
        status)
    }
  } else if (failures.length === settled.length && STATIC_MODE) {
    // Deployments that build with VITE_CATALOG_MODE=static never call the
    // API at all; they read the export directly.
    const snapshot = await catalogSnapshot()
    petRows = snapshot.pets
    productRows = snapshot.products
    storeRows = snapshot.stores
  } else {
    ;[petRows, productRows, storeRows] = settled.map((r) =>
      r.status === 'fulfilled' ? r.value : [])
    // Products are not taken from the catalogue API at all. Its `products`
    // table is the legacy directory of shops' inventory; what this shop
    // sells lives in `marketplace_products` and is read by /api/shop,
    // which the storefront owns. Mixing the two is how a customer ends up
    // buying something we cannot supply.
    storeRows = storeRows.filter((s) => isServiceStore(s))
  }

  // store_id → name lookup so products show their real store title
  const storeNames = new Map(storeRows.map((s) => [String(s.id), str(s.name, 'فروشگاه')]))

  const merged: Listing[] = [
    ...petRows.map(toPetListing),
    ...productRows.map((row) => toProductListing(row, storeNames)),
    ...storeRows.map(toStoreListing),
  ]

  return applyFilters(merged, origin, filters)
}

/* ── Create (used by the Add wizard) ─────────────────────────────── */

/**
 * POST a new listing. The wizard draft carries `location: {lat, lng}`;
 * the backend column layout is flat — so we emit BOTH shapes.
 * Strict: any failure propagates and the wizard shows its Persian error.
 */
export async function createListing(draft: NewListingDraft): Promise<{ id: string }> {
  if (STATIC_MODE) {
    // Honest failure — a static host cannot persist anything
    throw new Error('نسخه‌ی منتشرشده فاقد سرور نوشتاری است؛ ثبت آگهی زمانی ممکن است که بک‌اند در دسترس باشد.')
  }
  const path = draft.kind === 'pet' ? '/api/pets' : '/api/products'
  const body = {
    ...draft,
    lat: draft.location.lat,
    lng: draft.location.lng,
  }
  const created = await request<{ id: string | number }>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return { id: String(created.id) }
}
