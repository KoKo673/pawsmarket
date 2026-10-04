import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from 'react-router-dom'

import { AuthCard } from '@/components/auth/AuthCard'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { DetailModal } from '@/components/detail/DetailModal'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { useGeolocation } from '@/hooks/use-geolocation'
import { initEntranceMotion, MOTION } from '@/lib/motion'
import { AddPage } from '@/pages/AddPage'
import { AdoptionPage } from '@/pages/AdoptionPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { FeedPage } from '@/pages/FeedPage'
import { HomePage } from '@/pages/HomePage'
import { MyAccountPage } from '@/pages/MyAccountPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PetProfilePage } from '@/pages/PetProfilePage'
import { PetsDiscoverPage } from '@/pages/PetsDiscoverPage'
import { AppProviders } from '@/providers/AppProviders'
import { useAuthStore } from '@/store/auth.store'

/**
 * Page transition wrapper — uses the SHARED entrance tokens
 * (100ms / cubic-bezier(.16,1,.3,1) / 20px) from src/lib/motion.ts.
 * Sync AnimatePresence below mounts the NEW route immediately so content
 * never lags behind the URL even when a frame is throttled.
 */
function AnimatedPage({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: dim ? 0 : MOTION.distance }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: dim ? 0 : MOTION.closeDistance }}
      transition={{ duration: MOTION.duration / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

function AppRoutes() {
  const location = useLocation()
  // Detect the user's real coordinates once on mount (Tehran fallback until granted)
  useGeolocation({ autoRequest: true })
  // راستی‌آزمایی توکن ذخیره‌شده با /api/auth/me در اولین لود
  const hydrate = useAuthStore((s) => s.hydrate)
  useEffect(() => {
    void hydrate()
  }, [hydrate])
  // سیستم واحد انیمیشن ورود — یک‌بار در مرز layout، برای همه‌ی صفحات
  useEffect(() => {
    const boot = initEntranceMotion()
    return () => boot.dispose()
  }, [])
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
              path="/register"
              element={
                <AnimatedPage>
                  <AuthCard mode="register" />
                </AnimatedPage>
              }
            />
            <Route
              path="/login"
              element={
                <AnimatedPage>
                  <AuthCard mode="login" />
                </AnimatedPage>
              }
            />
            <Route
              path="/pets"
              element={
                <AnimatedPage>
                  <PetsDiscoverPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/adoption"
              element={
                <AnimatedPage>
                  <AdoptionPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/pet/:id"
              element={
                <AnimatedPage>
                  <PetProfilePage />
                </AnimatedPage>
              }
            />
            <Route
              path="/feed"
              element={
                <AnimatedPage>
                  <RequireAuth>
                    <FeedPage />
                  </RequireAuth>
                </AnimatedPage>
              }
            />
            <Route
              path="/me"
              element={
                <AnimatedPage>
                  <RequireAuth>
                    <MyAccountPage />
                  </RequireAuth>
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
