import { create } from 'zustand'

import { authApi, getToken, setToken, type AuthUser } from '@/lib/social-api'

type AuthStatus = 'loading' | 'anon' | 'authed'

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  /** یک‌بار در App صدا زده می‌شود: توکن ذخیره‌شده را با /me راستی‌آزمایی می‌کند */
  hydrate: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
}

/**
 * وضعیت احراز هویت — توکن در localStorage (کلید pawsmarket-auth-token)
 * و کاربر با هر بار لود از سرور راستی‌آزمایی می‌شود (نه اعتماد کورکورانه).
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,

  hydrate: async () => {
    if (!getToken()) {
      set({ status: 'anon', user: null })
      return
    }
    try {
      const { user } = await authApi.me()
      set({ status: 'authed', user })
    } catch {
      setToken(null)
      set({ status: 'anon', user: null })
    }
  },

  login: async (username, password) => {
    const { token, user } = await authApi.login(username, password)
    setToken(token)
    set({ status: 'authed', user })
  },

  register: async (username, password, displayName) => {
    const { token, user } = await authApi.register(username, password, displayName)
    setToken(token)
    set({ status: 'authed', user })
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      /* حتی اگر سرور جواب نده، خروج محلی انجام می‌شود */
    }
    setToken(null)
    set({ status: 'anon', user: null })
  },
}))
