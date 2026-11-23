/**
 * فروشگاه — محصولات، سبد، سفارش.
 *
 * Separate from `social-api` because the failure modes differ: a social
 * call failing means a missing like, a shop call failing means a customer
 * cannot pay. That one gets a message they can act on.
 */
import { getToken } from '@/lib/social-api'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export interface ShopProduct {
  id: number
  slug: string
  name: string
  price_toman: number
  image: string | null
  source: string | null
  updated_at: string
  /**
   * The source's own rating, or `null` when none exists.
   *
   * `null` is not `0`. Roughly 60% of the catalogue has no rating at
   * all, and a card that shows «۰.۰» for those is telling the shopper
   * the product was rated badly when nobody rated it. The UI must render
   * nothing for null.
   */
  rating: number | null
  rating_count: number | null
  /**
   * The source's brand, or `null` when it publishes none.
   *
   * Measured 2026-11-17: digikala-mcp sends one on 94 of 94 rows; Torob
   * sends none at all. NULL is not 'متفرقه' — that is Digikala's own
   * miscellaneous bucket and is mapped to NULL on the way in, because a
   * brand filter where the biggest value means "no brand" is worse than
   * no filter.
   */
  brand: string | null
}

export interface SimilarProduct {
  id: number
  name: string
  price_toman: number
  image: string | null
}

export interface ShopProductDetail extends ShopProduct {
  available: boolean
  source_url: string | null
  /** How many shops the source says carry this item — null when unknown. */
  shop_count: number | null
  /** Empty is a valid answer; the page renders no section for it. */
  similar: SimilarProduct[]
}

export interface CartLine {
  id: number
  product_id: number
  name: string
  qty: number
  unit_price: number
  price_when_added: number
  price_changed: boolean
  line_total: number
}

export interface Cart {
  items: CartLine[]
  total_toman: number
}

export interface OrderSummary {
  id: number
  status: string
  total_toman: number
  created_at: string
  paid_at: string | null
  delivery_eta_days: number | null
  shipped_at?: string | null
  tracking_code?: string | null
  tracking_carrier?: string | null
  /** از سرور، نه از مرورگر — فهرست و صفحهٔ جزئیات باید یک جواب بدهند. */
  can_repay?: boolean
  // No `delivery_slot`. It used to be here, matching a backend field that
  // was documented as a slot id from a `booking_slots` table no migration
  // ever created. The backend dropped it (app/routers/shop.py), so this
  // interface must not keep advertising it — a type that names a field the
  // server never sends is the kind of thing someone later reads and trusts.
}

export interface OrderDetail extends OrderSummary {
  contact_name: string
  contact_phone: string
  address: string
  note: string | null
  items: { qty: number; unit_price: number; name: string }[]
  /** از سرور می‌آید، نه از مرورگر: قاعده یک‌جا تعریف می‌شود. */
  can_repay?: boolean
}

/** ستون‌های رهگیری (مهاجرت 0036). `null` یعنی ثبت نشده — و صفحه همان را
 *  می‌گوید، نه یک خط خالی که شبیه باگ است. */
export interface OrderTracking {
  shipped_at?: string | null
  tracking_code?: string | null
  tracking_carrier?: string | null
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new Error('اتصال به سرور برقرار نشد')
  }
  if (!res.ok) {
    let detail = 'مشکلی پیش آمد'
    try {
      const body = await res.json() as { detail?: unknown }
      const d = body?.detail
      if (typeof d === 'string') {
        // 4xx from the app's own handlers: a Persian sentence built for a
        // customer ("قیمت این محصولات تغییر کرده است…").
        detail = d
      } else if (Array.isArray(d) && typeof d[0]?.msg === 'string') {
        // FastAPI's 422 shape is an ARRAY of {loc, msg, type}. Passing it
        // straight to Error() stringifies to "[object Object]" — measured,
        // the customer saw exactly that when a phone number failed the
        // backend's format check after passing the client's length check.
        detail = d[0].msg
      } else if (typeof d === 'object' && d !== null) {
        // /health/deep answers {status, checks, reason}.
        const r = (d as { reason?: unknown }).reason
        if (typeof r === 'string') detail = r
      }
    } catch {
      /* non-JSON body */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export const shopApi = {
  /**
   * `sort` is a KEY ('newest' | 'price_asc' | 'price_desc' | 'rating' |
   * 'popular'); the server whitelists it and falls back to the default for
   * an unknown value, so a stale bookmark still shows products.
   * `category` is the two-word group the server derives from the name.
   */
  products: (q = '', limit = 40, offset = 0, sort = 'newest', category = '') =>
    request<{ total: number; items: ShopProduct[] }>(
      `/api/shop/products?limit=${limit}&offset=${offset}&sort=${encodeURIComponent(sort)}` +
      (q ? `&q=${encodeURIComponent(q)}` : '') +
      (category ? `&category=${encodeURIComponent(category)}` : ''),
    ),

  /** The category chips. `total` says how many exist; the client shows a
   *  subset and must not imply it is showing all of them. */
  categories: () =>
    request<{ total: number; items: { name: string; count: number }[] }>(
      '/api/shop/categories'),

  product: (id: number | string) =>
    request<ShopProductDetail>(`/api/shop/products/${id}`),

  cart: () => request<Cart>('/api/shop/cart'),

  addToCart: (productId: number, qty = 1) =>
    request<Cart>('/api/shop/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, qty }),
    }),

  setQty: (itemId: number, qty: number) =>
    request<Cart>(`/api/shop/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ qty }),
    }),

  remove: (itemId: number) =>
    request<Cart>(`/api/shop/cart/${itemId}`, { method: 'DELETE' }),

  checkout: (input: {
    contact_name: string
    contact_phone: string
    address: string
    note?: string
    gateway: 'zibal' | 'zarinpal'
    delivery_eta_days: number
  }) =>
    request<{ order_id: number; total_toman: number; gateway: string; redirect_url: string }>(
      '/api/shop/checkout',
      { method: 'POST', body: JSON.stringify(input) },
    ),

  // The product page promises the customer that order status appears in
  // «سفارشهای من». Until these existed that promise led nowhere.
  orders: () => request<{ items: OrderSummary[] }>('/api/shop/orders'),

  order: (id: number | string) =>
    request<OrderDetail>(`/api/shop/orders/${id}`),

  /* The retry the checkout page has always told the customer to make.
     Until this existed, a `pending` order could never be paid at all: shop.py's
     own comment said "no repay route exists", and the customer had to rebuild
     the cart from scratch and hope the gateway worked the second time. */
  repay: (id: number, gateway: string) =>
    request<{ order_id: number; total_toman: number; gateway: string; redirect_url: string }>(
      `/api/shop/orders/${id}/pay`,
      { method: 'POST', body: JSON.stringify({ gateway }) },
    ),
}
