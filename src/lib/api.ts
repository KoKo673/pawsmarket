import { SHOP_ENRICHMENT } from '@/data/shops'
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

/** Same-origin always — the dev proxy owns the backend URL (see .env). */
const API_BASE = ''

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    })
  } catch {
    // Network-level failure (server down, DNS, proxy target offline)
    throw new ApiError(`Network error requesting ${path}`, 0)
  }
  if (!res.ok) {
    throw new ApiError(`API ${path} responded ${res.status}`, res.status)
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

/** Bundled fallback imagery — always present in /public/images/listings. */
const PET_IMAGE: Record<Species, string> = {
  dog: asset('images/listings/dog-golden.jpg'),
  cat: asset('images/listings/cat-orange.jpg'),
  rabbit: asset('images/listings/rabbit2.jpg'),
  bird: asset('images/listings/parrot.jpg'),
  fish: asset('images/listings/fish.jpg'),
  small: asset('images/listings/guinea.jpg'),
  other: asset('images/listings/dog-pug.jpg'),
}

const PRODUCT_IMAGE: Record<ProductCategory, string> = {
  food: asset('images/listings/food.jpg'),
  toy: asset('images/listings/supplies.jpg'),
  health: asset('images/listings/fish.jpg'),
  accessories: asset('images/listings/store2.jpg'),
  grooming: asset('images/listings/grooming.jpg'),
}

const STORE_IMAGE: Record<StoreCategory, string> = {
  shop: asset('images/listings/toys.jpg'),
  vet: asset('images/listings/vet.jpg'),
  groomer: asset('images/listings/petstore.jpg'),
  shelter: asset('images/listings/dog-corgi.jpg'),
  cafe: asset('images/listings/grooming.jpg'),
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
  if (/(groom|آرایش|bath|حمام)/.test(s)) return 'groomer'
  if (/(shelter|پناهگاه|rescue)/.test(s)) return 'shelter'
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

/** Wire row → PetListing (type-specific fields defaulted for display). */
function toPetListing(raw: RawRow): PetListing {
  const speciesRaw = str(raw.species, 'other')
  const species: Species = KNOWN_SPECIES.includes(speciesRaw as Species)
    ? (speciesRaw as Species)
    : 'other'
  const price = num(raw.price, 0)

  return {
    id: wireId('pet', raw),
    kind: 'pet',
    name: str(raw.name, 'حیوان خانگی'),
    description: str(raw.description, 'توضیحاتی برای این آگهی ثبت نشده است.'),
    images: Array.isArray(raw.images) && raw.images.length > 0 ? (raw.images as string[]) : [PET_IMAGE[species]],
    location: toPoint(raw),
    address: str(raw.address, 'تهران'),
    createdAt: str(raw.created_at ?? raw.createdAt, new Date(0).toISOString()),
    species,
    breed: str(raw.breed, 'نژاد نامشخص'),
    ageMonths: num(raw.ageMonths, 12),
    gender: raw.gender === 'female' ? 'female' : 'male',
    price,
    adoptable: bool(raw.adoptable, price === 0),
    medical: Array.isArray(raw.medical)
      ? (raw.medical.filter((m): m is MedicalFlag => KNOWN_MEDICAL.includes(m as MedicalFlag)) as MedicalFlag[])
      : [],
    ownerName: str(raw.ownerName, 'مالک ناشناس'),
  }
}

/**
 * Wire row → ProductListing.
 * `storeNames` maps `store_id` → store name from the parallel
 * /api/stores/nearby response (the products API only returns the FK).
 */
function toProductListing(raw: RawRow, storeNames: Map<string, string>): ProductListing {
  const name = str(raw.name, 'محصول')
  const category: ProductCategory = String(raw.category ?? '') in PRODUCT_IMAGE
    ? (raw.category as ProductCategory)
    : inferProductCategory(name)
  const storeName =
    str(raw.storeName, '') ||
    (raw.store_id != null ? (storeNames.get(String(raw.store_id)) ?? `فروشگاه شماره ${raw.store_id}`) : 'پازمارکت')

  return {
    id: wireId('product', raw),
    kind: 'product',
    name,
    description: str(raw.description, `«${name}» — توضیحات از سمت فروشگاه ارائه نشده است.`),
    images: Array.isArray(raw.images) && raw.images.length > 0 ? (raw.images as string[]) : [PRODUCT_IMAGE[category]],
    location: toPoint(raw),
    address: str(raw.address, 'تهران'),
    createdAt: str(raw.created_at ?? raw.createdAt, new Date(0).toISOString()),
    category,
    price: num(raw.price, 0),
    brand: str(raw.brand, 'بدون برند'),
    inStock: bool(raw.inStock, true),
    storeName,
    storeId: raw.store_id != null ? wireId('store', { id: raw.store_id }) : undefined,
  }
}

/**
 * Wire row → StoreListing.
 *
 * The API serialises only name/address/lat/lng — display metadata
 * (real phone, hours, product categories, description, official site)
 * comes from SHOP_ENRICHMENT keyed by shop name (built from OSM +
 * the shops' own websites, see scripts/seed_real_shops.py).
 * No invented values: missing phone → '' (renders «—»), missing
 * rating → 0 (renders «ثبت‌شده»), never a fake number.
 */
function toStoreListing(raw: RawRow): StoreListing {
  const name = str(raw.name, 'فروشگاه')
  const address = str(raw.address, 'تهران')
  const meta = SHOP_ENRICHMENT[name]
  const category: StoreCategory =
    (meta?.category as StoreCategory | undefined) ??
    (String(raw.category ?? '') in STORE_IMAGE ? (raw.category as StoreCategory) : inferStoreCategory(name, address))

  return {
    id: wireId('store', raw),
    kind: 'store',
    name,
    description:
      str(raw.description, '') ||
      meta?.description ||
      `«${name}» — توضیحات تکمیلی از سمت مجموعه ثبت نشده است.`,
    images: Array.isArray(raw.images) && raw.images.length > 0 ? (raw.images as string[]) : [STORE_IMAGE[category]],
    location: toPoint(raw),
    address,
    createdAt: str(raw.created_at ?? raw.createdAt, new Date(0).toISOString()),
    category,
    rating: num(raw.rating, 0),
    reviewCount: num(raw.reviewCount ?? raw.review_count, 0),
    opensAt: meta?.opensAt ?? str(raw.opensAt ?? raw.opens_at, '09:00'),
    closesAt: meta?.closesAt ?? str(raw.closesAt ?? raw.closes_at, '21:00'),
    phone: meta?.phone ?? str(raw.phone, ''),
    website: meta?.website,
    categories: meta?.categories,
  }
}

/* ── Geo query strings ─────────────────────────────────────────── */

function geoParams(origin: GeoPoint, filters: Filters): URLSearchParams {
  return new URLSearchParams({
    lat: origin.lat.toFixed(6),
    lng: origin.lng.toFixed(6),
    radius: String(filters.radiusKm),
    ...(filters.query ? { q: filters.query } : {}),
  })
}

/* ── Individual resource calls (raw wire rows) ───────────────────── */

async function getPetsRaw(origin: GeoPoint, filters: Filters): Promise<RawRow[]> {
  const path = `/api/pets?${geoParams(origin, filters)}`
  return expectArray(path, await request<unknown>(path))
}

async function getProductsRaw(origin: GeoPoint, filters: Filters): Promise<RawRow[]> {
  const path = `/api/products?${geoParams(origin, filters)}`
  return expectArray(path, await request<unknown>(path))
}

async function getStoresRaw(origin: GeoPoint, filters: Filters): Promise<RawRow[]> {
  const path = `/api/stores/nearby?${geoParams(origin, filters)}`
  return expectArray(path, await request<unknown>(path))
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
export async function fetchNearbyListings(
  origin: GeoPoint,
  filters: Filters,
): Promise<ListingWithDistance[]> {
  let petRows: RawRow[]
  let productRows: RawRow[]
  let storeRows: RawRow[]

  if (STATIC_MODE) {
    const path = `${import.meta.env.BASE_URL}catalog.json`
    const catalog = await request<{ pets?: unknown; products?: unknown; stores?: unknown }>(path)
    if (!Array.isArray(catalog.pets) || !Array.isArray(catalog.products) || !Array.isArray(catalog.stores)) {
      throw new ApiError(`Invalid catalog.json at ${path}: expected {pets,products,stores} arrays`, 200)
    }
    petRows = catalog.pets as RawRow[]
    productRows = catalog.products as RawRow[]
    storeRows = catalog.stores as RawRow[]
  } else {
    const settled = await Promise.allSettled([
      getPetsRaw(origin, filters),
      getProductsRaw(origin, filters),
      getStoresRaw(origin, filters),
    ])

    const failures = settled.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (failures.length > 0) {
      const reasons = failures.map((f) => String(f.reason instanceof Error ? f.reason.message : f.reason))
      const status = failures[0]?.reason instanceof ApiError ? failures[0].reason.status : 0
      throw new ApiError(`Nearby query incomplete: ${reasons.join(' | ')}`, status)
    }

    ;[petRows, productRows, storeRows] = settled.map(
      (r) => (r as PromiseFulfilledResult<RawRow[]>).value,
    )
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
