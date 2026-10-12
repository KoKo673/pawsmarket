import { create } from 'zustand'

import { authApi, getToken, setToken, socialApi, type AuthUser } from '@/lib/social-api'

type AuthStatus = 'loading' | 'anon' | 'authed'

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  /**
   * Pets owned by the signed-in user.
   *
   * The API used to answer "which pet am I acting as?" by taking the caller's
   * lowest-id pet, which is wrong the moment someone owns two — the follow
   * button then acted as, and reported the counts of, the wrong animal. The
   * client now sends `?as=<id>` explicitly, so it needs to know the ids.
   */
  myPets: { id: number; name: string }[]
  /** The pet the app is currently browsing as; defaults to the first. */
  activePetId: number | null
  setActivePetId: (petId: number | null) => void
  /** یک‌بار در App صدا زده می‌شود: توکن ذخیره‌شده را با /me راستی‌آزمایی می‌کند */
  hydrate: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
}

/**
 * Pets of the signed-in user.
 *
 * Best effort: a failure here only costs the `?as=` hint, and every endpoint
 * still falls back to the user's first pet, so this must never throw.
 */
async function loadMyPets(): Promise<{ id: number; name: string }[]> {
  try {
    const { items } = await socialApi.myPets()
    return items ?? []
  } catch {
    return []
  }
}

/**
 * وضعیت احراز هویت — توکن در localStorage (کلید pawsmarket-auth-token)
 * و کاربر با هر بار لود از سرور راستی‌آزمایی می‌شود (نه اعتماد کورکورانه).
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  myPets: [],
  activePetId: null,

  setActivePetId: (activePetId) => set({ activePetId }),

  hydrate: async () => {
    if (!getToken()) {
      set({ status: 'anon', user: null, myPets: [], activePetId: null })
      return
    }
    try {
      const { user } = await authApi.me()
      const myPets = await loadMyPets()
      set({
        status: 'authed',
        user,
        myPets,
        activePetId: myPets[0]?.id ?? null,
      })
    } catch {
      setToken(null)
      set({ status: 'anon', user: null, myPets: [], activePetId: null })
    }
  },

  login: async (username, password) => {
    const { token, user } = await authApi.login(username, password)
    setToken(token)
    const myPets = await loadMyPets()
    set({ status: 'authed', user, myPets, activePetId: myPets[0]?.id ?? null })
  },

  register: async (username, password, displayName) => {
    const { token, user } = await authApi.register(username, password, displayName)
    setToken(token)
    const myPets = await loadMyPets()
    set({ status: 'authed', user, myPets, activePetId: myPets[0]?.id ?? null })
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      /* حتی اگر سرور جواب نده، خروج محلی انجام می‌شود */
    }
    setToken(null)
    set({ status: 'anon', user: null, myPets: [], activePetId: null })
  },
}))
