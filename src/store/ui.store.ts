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

/**
 * The visitor's choice, or `null` for "follow the phone".
 *
 * `null` has to be a real state, not "whatever the OS said at first paint".
 * The old code wrote the OS-derived value into localStorage on the very
 * first visit, which converted an automatic match into an explicit choice
 * the visitor never made — and from then on a phone switching to dark did
 * nothing. That is the bug that was reported.
 */
type ThemeChoice = Theme | null

function readChoice(): ThemeChoice {
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolve(choice: ThemeChoice): Theme {
  return choice ?? systemTheme()
}

/**
 * Put the theme on <html>. Deliberately does NOT write to localStorage —
 * persisting is the job of `chooseTheme`, so that following the system
 * never silently turns into an override.
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: resolve(readChoice()),
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, next)
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

// Apply on module load so the first paint has the right theme — index.html
// ships `class="light"`, which would otherwise flash white on a dark phone.
applyTheme(useUiStore.getState().theme)

/**
 * Follow the phone while the visitor has not chosen a side.
 *
 * Without this, even a correct initial read only takes effect on the next
 * page load: switching the phone to dark with the site open did nothing.
 * A choice already in localStorage wins, and the listener stands down.
 *
 * `mq.addEventListener` rather than the deprecated `addListener` — this app
 * already requires it (see lib/motion.ts, same call for reduced motion).
 */
const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener('change', () => {
  if (readChoice() !== null) return
  const next = systemTheme()
  applyTheme(next)
  useUiStore.setState({ theme: next })
})
