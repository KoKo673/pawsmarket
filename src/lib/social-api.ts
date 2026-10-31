/**
 * کلاینت API اجتماعی — همان الگوی api.ts (strict، خطای ApiError فارسی‌پسند).
 * همه‌ی مسیرها نیازمند توکن Bearer هستند مگر خلافش ذکر شود.
 */
import { ApiError } from '@/lib/api'
import { faDigits } from '@/lib/fa'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const TOKEN_KEY = 'pawsmarket-auth-token'

/**
 * Publish mode without a backend: VITE_CATALOG_MODE=static ships a
 * catalog.json snapshot and every social call is rejected with a clear
 * message, so no one sees a login form that silently never submits.
 * The current Pages build sets VITE_API_BASE_URL instead, so this is off.
 */
const STATIC_MODE = import.meta.env.VITE_CATALOG_MODE === 'static'

/**
 * Resolve a media path returned by the API into a URL the browser can load.
 *
 * The API returns relative paths (`/media/<id>.png`) because that is the only
 * thing it knows. Rendered raw, the browser resolves them against the page
 * origin — which on the Pages build is koko673.github.io, not the API — so
 * every uploaded photo 404s and a post shows up as caption-only. Prefixing
 * with the API origin fixes it; absolute URLs and same-origin (dev) are left
 * alone.
 */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  if (!path.startsWith('/')) return path
  return `${API_BASE}${path}`
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage در دسترس نیست — فقط حافظه */
  }
}

/** خطای سرور را به پیام فارسی قابل‌نمایش تبدیل می‌کند. */
function detailOf(status: number, body: unknown, retryAfter?: string | null): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const d = (body as { detail: unknown }).detail
    if (typeof d === 'string') return d
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg)
  }
  if (status === 401) return 'نشست شما منقضی شده؛ دوباره وارد شوید'
  if (status === 409) return 'این نام کاربری قبلاً گرفته شده'
  // 403 covers two different situations, and saying the wrong one sends
  // the reader looking in the wrong place: a profile action by a
  // non-owner, and an operator-only route (product writes) hit by a
  // normal account. The server's own `detail` wins when it sends one —
  // this is the fallback for a 403 that carries none.
  if (status === 403) return 'اجازهٔ این کار را ندارید'
  if (status === 503)
    return 'در حال حاضر به سرور وصل نیستیم؛ لطفاً چند لحظه دیگر تلاش کنید'
  if (status === 429) {
    // The server sends Retry-After, so say exactly how long to wait rather
    // than a bare refusal the visitor can only guess at.
    const secs = Number(retryAfter ?? '')
    if (Number.isFinite(secs) && secs > 0) {
      return secs < 60
        ? `تلاش‌های زیاد؛ ${faDigits(secs)} ثانیه دیگر دوباره امتحان کنید`
        : `تلاش‌های زیاد؛ ${faDigits(Math.ceil(secs / 60))} دقیقه دیگر دوباره امتحان کنید`
    }
    return 'تلاش‌های زیاد؛ یک دقیقه دیگر دوباره امتحان کنید'
  }
  return 'مشکلی پیش آمد؛ دوباره تلاش کنید'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (STATIC_MODE) {
    // پیام شفاف برای نسخه‌ی نمایشی روی GitHub Pages
    throw new ApiError(
      'قابلیت‌های اجتماعی فقط روی نسخه‌ی محلی فعال‌اند (بک‌اند در حال اجرا نیست)',
      0,
    )
  }
  const token = getToken()
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init.body instanceof FormData
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError('اتصال به سرور برقرار نشد', 0)
  }
  if (!res.ok) {
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      /* بدنه‌ی غیر JSON */
    }
    throw new ApiError(detailOf(res.status, body, res.headers.get('Retry-After')), res.status)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/* ── انواع داده ─────────────────────────────────────────────── */

export interface AuthUser {
  id: number
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  /**
   * فقط برای کشیدن/نکشیدن لینک پنل. گیت واقعی سمت سرور است و هر مسیر
   * ادمین دوباره `is_admin` را می‌خواند؛ این مقدار فقط UI را ساده می‌کند.
   */
  is_admin?: boolean
}

export interface PetProfile {
  pet: { id: number; name: string; species: string; lat: number; lng: number }
  profile: {
    bio: string | null
    avatar_url: string | null
    cover_url: string | null
    birth_date: string | null
    gender: string | null
    is_public: boolean
    adoption_status: string | null
    adoption_note: string | null
    created_at: string
  }
  gallery: Array<{ id: number; url: string; caption: string | null; position: number }>
  counts: { followers: number; following: number; posts: number }
  is_following: boolean
  is_owner: boolean
}

export interface Post {
  id: number
  pet_id: number
  kind: 'post' | 'story'
  text: string | null
  images: string[]
  like_count: number
  created_at: string
  expires_at: string | null
  pet_name?: string
  pet_avatar?: string | null
  liked_by_me?: boolean
  comments_count?: number
}

export interface Comment {
  id: number
  post_id: number
  text: string
  created_at: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export interface Story extends Omit<Post, 'like_count'> {
  kind: 'story'
}

export interface AdoptionRequest {
  id: number
  pet_id: number
  user_id: number
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  decided_at: string | null
  pet_name: string
  pet_avatar: string | null
  requester_username: string
  requester_name: string | null
}

export interface DiscoverPet {
  id: number
  name: string
  species: string
  bio: string | null
  avatar_url: string | null
  adoption_status: string | null
  lat: number
  lng: number
  distance_m: number
}

/** One row of the followers / following lists. */
export interface FollowListItem {
  id: number
  name: string
  species: string
  avatar_url: string | null
}

/* ── احراز هویت ─────────────────────────────────────────────── */

export const authApi = {
  register: (username: string, password: string, displayName?: string,
             email?: string) =>
    request<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        ...(displayName ? { display_name: displayName } : {}),
        ...(email ? { email } : {}),
      }),
    }),
  login: (username: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
  /** رمز موقت می‌گیرد. پاسخ برای حساب ناموجود هم یکسان است. */
  /**
   * بازیابی رمز — فقط با شمارهٔ موبایل.
   *
   * The email variant is gone from the server too: no SMTP exists and no
   * account has an email, so the old call showed a temporary password on
   * screen that was never mailed and, for most accounts, was a placeholder
   * that could not verify. The response still carries no password — the
   * real one goes by SMS to a verified number.
   */
  recover: (phone: string) =>
    request<{ ok: boolean; message: string }>(
      '/api/auth/recover', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword,
                             new_password: newPassword }),
    }),
  /**
   * اولین رمز برای حسابی که با کد یک‌بارمصرف ساخته شده.
   *
   * Separate from changePassword because that one demands the current
   * password, and a phone-signup account has none to give. The server
   * answers 409 once a password exists, so this is only ever a first set.
   */
  setPassword: (newPassword: string) =>
    request<{ ok: boolean; message: string }>('/api/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    }),

  /**
   * کد یک‌بارمصرف پیامکی.
   *
   * پاسخ `request` برای شمارهٔ ثبت‌شده و ثبت‌نشده یکسان است — سرور
   * عمداً هیچ تفاوتی نمی‌گذارد تا کسی نتواند با امتحان‌کردن شماره‌ها
   * بفهمد کدام حساب دارد. پس فرانت هم نباید از روی پاسخ حدس بزند که
   * کاربر تازه است یا نه؛ تنها `is_new` در پاسخ `verify` این را
   * می‌گوید، و فقط بعد از تأیید موفق کد.
   */
  otpRequest: (phone: string, purpose: 'signup' | 'login') =>
    request<{ ok: boolean; message: string }>('/api/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose }),
    }),
  /** آیا این نام کاربری آزاد است؟ — برای بازخورد زنده در فرم ثبت‌نام. */
  usernameAvailable: (username: string) =>
    request<{ available: boolean; reason: 'taken' | 'reserved' | 'format' | null }>(
      `/api/auth/username/available?username=${encodeURIComponent(username)}`,
    ),

  /**
   * نام کاربری خودت را انتخاب کن — یک بار، بلافاصله پس از ثبت‌نام.
   * سرور اگر حسابی از قبل نام انتخابی داشته باشد ۴۰۹ می‌دهد.
   */
  setUsername: (username: string) =>
    request<{ user: AuthUser }>('/api/auth/username', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  otpVerify: (phone: string, code: string, purpose: 'signup' | 'login',
              displayName?: string) =>
    request<{ token: string; user: AuthUser; is_new: boolean }>(
      '/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          code,
          purpose,
          ...(displayName ? { display_name: displayName } : {}),
        }),
      }),
}

/* ── پروفایل و اجتماعی ──────────────────────────────────────── */

/** `?as=<pet>` — which of the viewer's own pets is acting. Omitted when none. */
const asParam = (asPet?: number | string) =>
  asPet === undefined || asPet === null ? '' : `?as=${encodeURIComponent(String(asPet))}`

const qs = (params: Record<string, string | number | undefined | null>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const socialApi = {
  createProfile: (data: { name: string; species: string; bio?: string; lat: number; lng: number }) =>
    request<PetProfile>('/api/pets/profile', { method: 'POST', body: JSON.stringify(data) }),
  /** `asPet` = the viewer's own pet id, so `is_following` is about that pet. */
  getProfile: (petId: number | string, asPet?: number | string) =>
    request<PetProfile>(`/api/pets/${petId}${asParam(asPet)}`),
  patchProfile: (
    petId: number | string,
    data: Partial<{
      bio: string
      avatar_url: string
      cover_url: string
      adoption_status: string
      adoption_note: string
    }>,
  ) => request<PetProfile>(`/api/pets/${petId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addPhoto: (petId: number | string, url: string, caption?: string) =>
    request<{ id: number; url: string }>(`/api/pets/${petId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ url, caption }),
    }),
  petPosts: (petId: number | string, before?: string) =>
    request<{ items: Post[]; next_before: string | null }>(
      `/api/pets/${petId}/posts${before ? `?before=${encodeURIComponent(before)}` : ''}`,
    ),
  petStories: (petId: number | string) =>
    request<{ items: Story[]; next_before: string | null }>(`/api/pets/${petId}/stories`),
  createPost: (petId: number | string, text: string, images: string[], kind: 'post' | 'story' = 'post') =>
    request<Post>(`/api/pets/${petId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ text, images, kind }),
    }),
  /* ── دنبال کردن ──
     `as` names WHICH of the viewer's own pets is acting. Without it the server
     used the viewer's lowest-id pet, so a user with two animals followed and
     unfollowed as their first one and saw its counts on the second's page. */
  follow: (petId: number | string, asPet?: number | string) =>
    request<{ following: boolean; followers: number }>(
      `/api/pets/${petId}/follow${asParam(asPet)}`, { method: 'POST' }),
  unfollow: (petId: number | string, asPet?: number | string) =>
    request<{ following: boolean; followers: number }>(
      `/api/pets/${petId}/follow${asParam(asPet)}`, { method: 'DELETE' }),
  followers: (petId: number | string) =>
    request<{ items: FollowListItem[]; next_before: string | null }>(
      `/api/pets/${petId}/followers`,
    ),
  following: (petId: number | string) =>
    request<{ items: FollowListItem[]; next_before: string | null }>(
      `/api/pets/${petId}/following`,
    ),
  feed: (before?: string, asPet?: number | string) =>
    request<{ items: Post[]; next_before: string | null }>(
      `/api/feed${qs({ before, as: asPet })}`,
    ),
  /** The caller's own pets — needed to say which one is acting on follow/feed. */
  myPets: () =>
    request<{ items: { id: number; name: string; species: string; avatar_url: string | null }[] }>(
      '/api/me/pets',
    ),
  discover: (lat: number, lng: number, radius = 10000) =>
    request<{ items: DiscoverPet[] }>(`/api/discover/pets?lat=${lat}&lng=${lng}&radius=${radius}`),
  uploadMedia: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ url: string }>('/api/media', { method: 'POST', body: form })
  },

  /* ── واکنش‌ها (فاز B) ── */
  like: (postId: number | string) =>
    request<{ liked: boolean; like_count: number }>(`/api/posts/${postId}/like`, { method: 'POST' }),
  unlike: (postId: number | string) =>
    request<{ liked: boolean; like_count: number }>(`/api/posts/${postId}/like`, { method: 'DELETE' }),
  listComments: (postId: number | string, before?: string) =>
    request<{ items: Comment[]; next_before: string | null }>(
      `/api/posts/${postId}/comments${before ? `?before=${encodeURIComponent(before)}` : ''}`,
    ),
  /* ── سرپرستی (فاز C) ── */
  requestAdoption: (petId: number | string, message: string) =>
    request<AdoptionRequest>(`/api/pets/${petId}/adoption-requests`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  petAdoptionRequests: (petId: number | string) =>
    request<{ items: AdoptionRequest[] }>(`/api/pets/${petId}/adoption-requests`),
  myAdoptionBox: () =>
    request<{ outgoing: AdoptionRequest[]; incoming: AdoptionRequest[] }>(
      '/api/me/adoption-requests',
    ),
  decideAdoption: (requestId: number | string, action: 'accept' | 'reject') =>
    request<{ id: number; status: string; pet_id?: number }>(
      `/api/adoption-requests/${requestId}/decision`,
      { method: 'POST', body: JSON.stringify({ action }) },
    ),
  adoptablePets: (lat: number, lng: number, radius = 50000) =>
    request<{ items: DiscoverPet[] }>(
      `/api/discover/pets?lat=${lat}&lng=${lng}&radius=${radius}`,
    ),

  addComment: (postId: number | string, text: string) =>
    request<Comment>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
}
