/**
 * PawsMarket domain types
 * ───────────────────────
 * Mirrors the Flask + PostGIS API contract. `GeoPoint` maps 1:1 to a
 * PostGIS geography column; listings always carry a point so the backend
 * can run ST_DWithin radius queries (`/api/stores/nearby?lat&lng&radius`).
 */

/** WGS84 coordinate pair (PostGIS `geography(Point, 4326)`). */
export interface GeoPoint {
  lat: number
  lng: number
}

export type ListingKind = 'pet' | 'product' | 'store'

export type Species = 'dog' | 'cat' | 'rabbit' | 'bird' | 'fish' | 'small' | 'other'

export type ProductCategory = 'food' | 'toy' | 'health' | 'accessories' | 'grooming'

export type StoreCategory = 'shop' | 'vet' | 'groomer' | 'shelter' | 'cafe'

/** Categorical medical flags shown on pet detail cards. */
export type MedicalFlag = 'vaccinated' | 'sterilized' | 'microchipped' | 'needs-care' | 'checkup-due'

/** Fields every listing shares. */
export interface BaseListing {
  id: string
  kind: ListingKind
  name: string
  description: string
  /** Local `/images/listings/…` paths (bundled — no runtime CDN dependency). */
  images: string[]
  location: GeoPoint
  address: string
  createdAt: string // ISO 8601
}

export interface PetListing extends BaseListing {
  kind: 'pet'
  species: Species
  breed: string
  /** Age in months — stored as an int for easy API math. */
  ageMonths: number
  gender: 'male' | 'female'
  /** Sale price in USD. `0` + `adoptable: true` = shelter adoption. */
  price: number
  adoptable: boolean
  medical: MedicalFlag[]
  ownerName: string
}

export interface ProductListing extends BaseListing {
  kind: 'product'
  category: ProductCategory
  price: number
  brand: string
  inStock: boolean
  /** Store the product is sold at (display name only — join done server-side). */
  storeName: string
  /** شناسه‌ی namespaced فروشگاه (store:3) برای پیمایش به جزئیات فروشگاه */
  storeId?: string
}

export interface StoreListing extends BaseListing {
  kind: 'store'
  category: StoreCategory
  /** 0–5, one decimal. 0 = هنوز امتیازی ثبت نشده. */
  rating: number
  reviewCount: number
  /** Opening hours, 24h local time, e.g. `"09:00"`. */
  opensAt: string
  closesAt: string
  /** Empty string = فروشگاه شماره‌ی تماس ثبت‌نشده دارد. */
  phone: string
  /** فروشگاه‌های واقعی: سایت رسمی (اختیاری) */
  website?: string
  /** حوزه‌های فعالیت/کالاهای عرضه‌شده (از سایت یا OSM استخراج‌شده) */
  categories?: string[]
}

export type Listing = PetListing | ProductListing | StoreListing

/** A listing decorated with its distance from the search origin (km). */
export type ListingWithDistance = Listing & { distanceKm: number }

/* ── Search / filter contract (query params on /api calls) ────────── */

export type SortOption = 'distance' | 'price-asc' | 'price-desc' | 'newest'

export interface Filters {
  /** Free-text keyword (name/brand/breed match). */
  query: string
  /** Radius of the geo query in kilometers. */
  radiusKm: number
  /** Inclusive price bounds (USD). */
  priceRange: [number, number]
  /** Active listing kinds; empty = all. */
  kinds: ListingKind[]
  /** Active species; empty = all. Applies to pet listings only. */
  species: Species[]
  /**
   * Active product/store categories (e.g. `food`, `vet`, `groomer`).
   * Empty = all. When set, pet listings are excluded — a "Cat Food"
   * chip should never show a cat for sale.
   */
  categories: (ProductCategory | StoreCategory)[]
  sort: SortOption
}

/** Payload the Add wizard POSTs (files are uploaded as multipart separately). */
export type NewListingDraft =
  | Omit<PetListing, 'id' | 'createdAt' | 'images'> & { images: string[] }
  | Omit<ProductListing, 'id' | 'createdAt' | 'images'> & { images: string[] }
