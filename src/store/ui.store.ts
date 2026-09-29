import { create } from 'zustand'

type Theme = 'light' | 'dark'
type MobileView = 'list' | 'map'

interface UiState {
  theme: Theme
  toggleTheme: () => void

  /** Listing id whose detail sheet is open (null = closed). */
  selectedId: string | null
  openDetail: (id: string) => void
  closeDetail: () => void

  /** Mobile explore pane: card list vs. map (segmented Tabs control). */
  mobileView: MobileView
  setMobileView: (view: MobileView) => void

  /** Slide-over filter sheet on mobile / collapsible rail on desktop. */
  filterDrawerOpen: boolean
  setFilterDrawerOpen: (open: boolean) => void
}

const THEME_KEY = 'pawsmarket-theme'

/** Reads persisted theme once, falls back to OS preference. */
function initTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  localStorage.setItem(THEME_KEY, theme)
}

export const useUiStore = create<UiState>((set, get) => ({
  // Side-effectful initializer (Vite SPA — safe at module scope)
  theme: initTheme(),
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },

  selectedId: null,
  openDetail: (id) => set({ selectedId: id }),
  closeDetail: () => set({ selectedId: null }),

  mobileView: 'list',
  setMobileView: (mobileView) => set({ mobileView }),

  filterDrawerOpen: false,
  setFilterDrawerOpen: (filterDrawerOpen) => set({ filterDrawerOpen }),
}))

// Apply stored theme to <html> immediately so there's no flash on reload.
applyTheme(initTheme())
