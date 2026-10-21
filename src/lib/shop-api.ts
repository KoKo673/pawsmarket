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
}

export interface ShopProductDetail extends ShopProduct {
  available: boolean
  source_url: string | null
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
      const body = await res.json() as { detail?: string }
      if (body?.detail) detail = body.detail
    } catch {
      /* non-JSON body */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export const shopApi = {
  products: (q = '', limit = 40, offset = 0) =>
    request<{ total: number; items: ShopProduct[] }>(
      `/api/shop/products?limit=${limit}&offset=${offset}` +
      (q ? `&q=${encodeURIComponent(q)}` : ''),
    ),

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
  }) =>
    request<{ order_id: number; total_toman: number; gateway: string; redirect_url: string }>(
      '/api/shop/checkout',
      { method: 'POST', body: JSON.stringify(input) },
    ),
}
