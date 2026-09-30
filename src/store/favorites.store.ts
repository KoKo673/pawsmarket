import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * علاقه‌مندی‌های کاربر — در localStorage می‌ماند (بدون نیاز به لاگین).
 * شناسه‌ها namespaced هستند (`pet:3`) و بین حالت‌های live/static یکسان‌اند.
 */
interface FavoritesState {
  ids: string[]
  toggle: (id: string) => void
  clear: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set({
          ids: get().ids.includes(id) ? get().ids.filter((x) => x !== id) : [...get().ids, id],
        }),
      clear: () => set({ ids: [] }),
    }),
    { name: 'pawsmarket-favorites' },
  ),
)
