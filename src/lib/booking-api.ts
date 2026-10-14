/**
 * کلاینت نوبت‌دهی.
 *
 * The token in a manage link is the business's only credential — it is what
 * lets a clinic that has never signed up answer a request. It travels in the
 * URL, never in a shared list response.
 */
import { ApiError } from '@/lib/api'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const TOKEN_KEY = 'pawsmarket-auth-token'

export interface Booking {
  id: number
  store_id: number
  store_name: string | null
  service: string
  preferred_at: string
  window_minutes: number
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'done'
  note: string | null
  contact_name: string
  contact_phone: string
  decision_note: string | null
  decided_at: string | null
  created_at: string | null
  /** Only ever present in the response to the customer who created it. */
  manage_token?: string
}

export interface NewBooking {
  store_id: number
  service: string
  preferred_at: string
  window_minutes?: number
  note?: string
  contact_name: string
  contact_phone: string
  pet_id?: number
}

function authHeaders(): Record<string, string> {
  try {
    const t = localStorage.getItem(TOKEN_KEY)
    return t ? { Authorization: `Bearer ${t}` } : {}
  } catch {
    return {}
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...init.headers,
      },
      signal: controller.signal,
      ...init,
    })
  } catch {
    throw new ApiError(
      'در حال حاضر به سرور وصل نیستیم؛ لطفاً چند لحظه دیگر تلاش کنید', 0)
  } finally {
    clearTimeout(timer)
  }

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    /* بدنه‌ی غیر JSON */
  }

  if (!res.ok) {
    let msg = 'مشکلی پیش آمد؛ دوباره تلاش کنید'
    if (body && typeof body === 'object' && 'detail' in body) {
      const d = (body as { detail: unknown }).detail
      if (typeof d === 'string') msg = d
    } else if (res.status === 503) {
      msg = 'در حال حاضر به سرور وصل نیستیم؛ چند لحظه دیگر تلاش کنید'
    }
    throw new ApiError(msg, res.status)
  }
  return body as T
}

export const bookingApi = {
  /** درخواست نوبت — حساب کاربری لازم نیست. */
  create: (data: NewBooking) =>
    request<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** درخواست‌های خودِ کاربر (نیازمند ورود). */
  mine: () => request<{ items: Booking[] }>('/api/bookings/mine'),

  cancel: (id: number | string) =>
    request<{ ok: boolean; status: string }>(
      `/api/bookings/${id}/cancel`, { method: 'POST' }),

  /* ── مسیر مرکز: بدون حساب، فقط با توکن لینک ── */

  viewForBusiness: (token: string) =>
    request<Booking>(`/api/bookings/manage/${encodeURIComponent(token)}`),

  decide: (token: string, action: 'confirm' | 'decline',
           decisionNote?: string) =>
    request<{ ok: boolean; status: string }>(
      `/api/bookings/manage/${encodeURIComponent(token)}/decision`,
      {
        method: 'POST',
        body: JSON.stringify({ action, decision_note: decisionNote }),
      }),
}
