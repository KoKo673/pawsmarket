import { AnimatePresence, motion } from 'framer-motion'
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from 'react-router-dom'

import { DetailModal } from '@/components/detail/DetailModal'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { useGeolocation } from '@/hooks/use-geolocation'
import { AddPage } from '@/pages/AddPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AppProviders } from '@/providers/AppProviders'

/**
 * Page transition wrapper.
 *
 * Uses `initial={false}`-safe opacity only — if the window is occluded
 * (animations frozen), the page still renders its final state as soon as
 * a frame runs, and `AnimatePresence` below mounts the NEW route
 * immediately (sync mode) so content never lags behind the URL.
 */
function AnimatedPage({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: dim ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: dim ? 0 : -8 }}
      transition={{ duration: dim ? 0.18 : 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function AppRoutes() {
  const location = useLocation()
  // Detect the user's real coordinates once on mount (Tehran fallback until granted)
  useGeolocation({ autoRequest: true })
  // The Explore view is a full-height app surface — no footer there
  const isExplore = location.pathname === '/explore'

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="flex-1">
        {/*
          Sync mode (not "wait"): the incoming route mounts IMMEDIATELY
          while the old one fades out. With mode="wait" a frozen exit
          animation (occluded/background window) stranded users on a URL
          whose content never swapped — content/URL sync beats staged exits.
        */}
        <AnimatePresence initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <AnimatedPage>
                  <HomePage />
                </AnimatedPage>
              }
            />
            <Route
              path="/explore"
              element={
                <AnimatedPage dim>
                  <ExplorePage />
                </AnimatedPage>
              }
            />
            <Route
              path="/add"
              element={
                <AnimatedPage>
                  <AddPage />
                </AnimatedPage>
              }
            />
            <Route
              path="*"
              element={
                <AnimatedPage>
                  <NotFoundPage />
                </AnimatedPage>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      {!isExplore && <Footer />}

      {/* Global detail sheet — opened by cards, map pins, and rails */}
      <DetailModal />
    </div>
  )
}

export default function App() {
  // GitHub Pages has no SPA fallback (deep links would 404) — the published
  // build uses HashRouter (/#/explore); local dev keeps clean URLs.
  const Router = import.meta.env.VITE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter
  return (
    <AppProviders>
      <Router>
        <AppRoutes />
      </Router>
    </AppProviders>
  )
}
