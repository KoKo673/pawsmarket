/**
 * کلاینت API اجتماعی — همان الگوی api.ts (strict، خطای ApiError فارسی‌پسند).
 * همه‌ی مسیرها نیازمند توکن Bearer هستند مگر خلافش ذکر شود.
 */
import { ApiError } from '@/lib/api'

const API_BASE = ''
const TOKEN_KEY = 'pawsmarket-auth-token'

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
function detailOf(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const d = (body as { detail: unknown }).detail
    if (typeof d === 'string') return d
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg)
  }
  if (status === 401) return 'نشست شما منقضی شده؛ دوباره وارد شوید'
  if (status === 409) return 'این نام کاربری قبلاً گرفته شده'
  if (status === 403) return 'این عملیات فقط برای صاحب این پروفایل است'
  return 'مشکلی پیش آمد؛ دوباره تلاش کنید'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    throw new ApiError(detailOf(res.status, body), res.status)
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

/* ── احراز هویت ─────────────────────────────────────────────── */

export const authApi = {
  register: (username: string, password: string, displayName?: string) =>
    request<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        ...(displayName ? { display_name: displayName } : {}),
      }),
    }),
  login: (username: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
}

/* ── پروفایل و اجتماعی ──────────────────────────────────────── */

export const socialApi = {
  createProfile: (data: { name: string; species: string; bio?: string; lat: number; lng: number }) =>
    request<PetProfile>('/api/pets/profile', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: (petId: number | string) => request<PetProfile>(`/api/pets/${petId}`),
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
  follow: (petId: number | string) =>
    request<{ following: boolean; followers: number }>(`/api/pets/${petId}/follow`, { method: 'POST' }),
  unfollow: (petId: number | string) =>
    request<{ following: boolean; followers: number }>(`/api/pets/${petId}/follow`, { method: 'DELETE' }),
  feed: (before?: string) =>
    request<{ items: Post[]; next_before: string | null }>(
      `/api/feed${before ? `?before=${encodeURIComponent(before)}` : ''}`,
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
  addComment: (postId: number | string, text: string) =>
    request<Comment>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
}
