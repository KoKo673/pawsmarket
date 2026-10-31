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

/* A parameter property (`constructor(public status: number, …)`) is not
   erasable syntax: it emits an assignment, and this project compiles with
   `erasableSyntaxOnly` so nothing the type-checker runs has to be rewritten
   by a transpiler that only strips types. Declared and assigned explicitly. */
export class AdminError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
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

/**
 * یک درخواست دسترسی به داشبورد، با شواهدی که می‌شود بررسی کرد.
 *
 * `national_id`, `licence_no` and `proof` are what make this a
 * *verification* rather than a name-and-phone claim — migration 0017 added
 * them so the reviewer decides from this list. A type without them would
 * have produced a screen that approves on a name alone, which is exactly
 * the hole 0017 was written to close.
 */
export interface Claim {
  id: number
  store_id: number
  store_name: string
  address: string
  category: string
  name: string
  role: string
  phone: string
  email: string | null
  national_id: string | null
  licence_no: string | null
  proof: string | null
  note: string | null
  status: string
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

/**
 * The three empty states, kept apart on purpose.
 *
 *   no_id         sent before ids were kept — nothing to ask about
 *   never_asked   has an id and was never polled — the reconciler is dead
 *   processing    asked, telecom has not reported yet — wait
 *
 * Collapsing them into one number is how a broken reconciler looks like a
 * working one.
 */
export interface SmsDelivery {
  announced: number
  no_id: number
  never_asked: number
  delivered: number
  undelivered: number
  processing: number
  unknown: number
  blacklisted: number
  last_checked: string | null
  reconciler_stalled: boolean
  items: Array<{
    id: number
    store_id: number
    status: string
    contact_phone: string
    notified_at: string
    sms_message_id: number | null
    sms_delivery_state: number | null
    sms_checked_at: string | null
    delivery_fa: string | null
  }>
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

  /* ── درخواست‌های دسترسی ─────────────────────────────────────
   *
   * Approving mints the dashboard link in the same transaction that flips
   * the claim — a claim marked approved with no link is a business that was
   * told yes and never heard from us again. So the URL comes back on the
   * approve call and must be shown once: the server keeps only its hash.
   */
  claims: (status = 'pending') =>
    call<{ status: string; items: Claim[] }>(
      `/api/admin/claims?status=${encodeURIComponent(status)}`),

  approveClaim: (id: number) =>
    call<{ ok: boolean; store: string; url: string }>(
      `/api/admin/claims/${id}/approve`, { method: 'POST', body: '{}' }),

  rejectClaim: (id: number) =>
    call<{ ok: boolean }>(
      `/api/admin/claims/${id}/reject`, { method: 'POST', body: '{}' }),

  /* ── تحویل پیامک ─────────────────────────────────────────────
   *
   * Read is the honest count of all three empty states; the POST asks the
   * gateway about every row that has an id and no final answer yet.
   */
  smsDelivery: () => call<SmsDelivery>('/api/admin/sms-delivery'),

  reconcileSms: (limit = 100) =>
    call<{ asked: number; updated: number; still_unknown: number
           failed: number; no_provider: boolean
           states: Record<string, number> }>(
      `/api/admin/sms-delivery/reconcile?limit=${limit}`, {
        method: 'POST', body: '{}',
      }),
}
