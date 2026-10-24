/**
 * کلاینت پنل ادمین.
 *
 * Same bearer token the rest of the app uses — the admin flag lives on the
 * user row, so there is no separate admin credential for the browser to
 * hold. The destructive endpoints (`/admin/catalog/replace`, `/admin/migrate`)
 * are deliberately NOT wrapped here: they need `X-Admin-Key`, which is a
 * credential the browser never gets. A page that could drop the catalogue
 * with a stolen session token would be a page worth stealing a session for.
 */
import { getToken } from '@/lib/social-api'

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export class AdminError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'AdminError'
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  })
  if (res.status === 404) {
    // The server answers 404 — not 403 — to a signed-in non-admin, so that
    // a normal user never learns the admin surface exists. The page shows
    // the same "not found" shell for both cases and does not distinguish.
    throw new AdminError(404, 'این صفحه پیدا نشد')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminError(res.status,
      (body as { detail?: string })?.detail || 'درخواست انجام نشد')
  }
  return body as T
}

/* ── انواع ─────────────────────────────────────────────────── */

export interface Overview {
  users: number
  users_week: number
  stores: number
  stores_with_dashboard: number
  products: number
  orders: number
  orders_paid: number
  orders_today: number
  revenue_toman: string
  bookings: number
  bookings_pending: number
  tickets_open: number
  last_sync: string
}

export interface AdminUser {
  id: number
  username: string
  display_name: string | null
  created_at: string
  is_admin: boolean
  orders: number
  pets: number
}

export interface AdminOrder {
  id: number
  status: string
  total_toman: string
  contact_name: string
  contact_phone: string
  address: string
  created_at: string
  paid_at: string | null
  username: string | null
  items: number
}

export interface OrderLine {
  id: number
  product_id: number
  product_name: string | null
  qty: number
  unit_price: string
  line_total: string
  offer_id: number | null
}

export interface AdminOrderDetail {
  id: number
  status: string
  total_toman: string
  contact_name: string
  contact_phone: string
  address: string
  note: string | null
  created_at: string
  paid_at: string | null
  updated_at: string
  user_id: number | null
  username: string | null
  /** نامش `lines` است نه `items` — در فهرست، `items` یعنی «تعداد اقلام». */
  lines: OrderLine[]
}

export interface SyncRun {
  id: number
  started_at: string
  finished_at: string | null
  queries: number | null
  offers_seen: number | null
  offers_written: number | null
  products_created: number | null
  products_repriced: number | null
  sources_failed: unknown
}

export interface StoreRow {
  id: number
  name: string
  address: string
  category: string
  has_dashboard: boolean
  bookings: number
}

export interface Ticket {
  id: number
  subject: string
  status: string
  topic: string
  created_at: string
  last_reply_at: string | null
  username: string | null
  contact_name: string
  contact_phone: string
  replies: number
}

export interface TicketMessage {
  id: number
  author: 'customer' | 'agent' | 'system'
  body: string
  created_at: string
}

export interface TicketThread {
  id: number
  subject: string
  status: string
  topic: string
  contact_name: string
  contact_phone: string
  order_id: number | null
  created_at: string
  messages: TicketMessage[]
}

/* ── مسیرها ────────────────────────────────────────────────── */

export const adminApi = {
  overview: () => call<Overview>('/api/admin/overview'),

  users: (q = '', limit = 50, offset = 0) =>
    call<{ total: number; items: AdminUser[] }>(
      `/api/admin/users?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`),

  orders: (status = '', limit = 50, offset = 0) =>
    call<{ total: number; items: AdminOrder[] }>(
      `/api/admin/orders?status=${encodeURIComponent(status)}&limit=${limit}&offset=${offset}`),

  order: (id: number) => call<AdminOrderDetail>(`/api/admin/orders/${id}`),

  syncRuns: (limit = 20) =>
    call<{ items: SyncRun[] }>(`/api/admin/sync-runs?limit=${limit}`),

  stores: (q = '', limit = 30) =>
    call<{ total: number; with_dashboard: number; items: StoreRow[] }>(
      `/api/admin/stores?q=${encodeURIComponent(q)}&limit=${limit}`),

  /** Returns the raw URL once. The server keeps only its hash. */
  dashboardLink: (storeId: number) =>
    call<{ store_id: number; name: string; url: string }>(
      `/api/store/${storeId}/dashboard-link`, { method: 'POST', body: '{}' }),

  tickets: (status = 'open') =>
    call<{ status: string; items: Ticket[] }>(
      `/api/support/admin/tickets?status=${encodeURIComponent(status)}`),

  ticket: (id: number) =>
    call<TicketThread>(`/api/support/admin/tickets/${id}`),

  reply: (id: number, body: string) =>
    call<{ ok: boolean }>(`/api/support/admin/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  setTicketStatus: (id: number, status: string) =>
    call<{ ok: boolean; status: string }>(
      `/api/support/admin/tickets/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
}
