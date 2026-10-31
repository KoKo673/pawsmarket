import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from 'react-router-dom'

import { RequireAdmin } from '@/components/auth/RequireAdmin'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { useGeolocation } from '@/hooks/use-geolocation'
import { initEntranceMotion, MOTION } from '@/lib/motion'
import { HomePage } from '@/pages/HomePage'
import { AppProviders } from '@/providers/AppProviders'
import { useAuthStore } from '@/store/auth.store'

/**
 * Routes are split, and the home page is the only one in the initial bundle.
 *
 * Everything used to be imported eagerly, so a visitor who typed the URL and
 * looked at one screen downloaded the map (Leaflet), the add-listing wizard
 * and the account pages as well: 1.4 MB of JavaScript before anything
 * rendered. The first screen now carries only what it draws.
 *
 * HomePage is deliberately NOT lazy — it is the landing route, and splitting
 * it would add a round trip to the one page every visitor sees.
 */
const ExplorePage = lazy(() =>
  import('@/pages/ExplorePage').then((m) => ({ default: m.ExplorePage })))
const AddPage = lazy(() =>
  import('@/pages/AddPage').then((m) => ({ default: m.AddPage })))
const AdoptionPage = lazy(() =>
  import('@/pages/AdoptionPage').then((m) => ({ default: m.AdoptionPage })))
const FeedPage = lazy(() =>
  import('@/pages/FeedPage').then((m) => ({ default: m.FeedPage })))
const FollowListPage = lazy(() =>
  import('@/pages/FollowListPage').then((m) => ({ default: m.FollowListPage })))
const MyAccountPage = lazy(() =>
  import('@/pages/MyAccountPage').then((m) => ({ default: m.MyAccountPage })))
const PetProfilePage = lazy(() =>
  import('@/pages/PetProfilePage').then((m) => ({ default: m.PetProfilePage })))
const PetsDiscoverPage = lazy(() =>
  import('@/pages/PetsDiscoverPage').then((m) => ({ default: m.PetsDiscoverPage })))
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const AuthCard = lazy(() =>
  import('@/components/auth/AuthCard').then((m) => ({ default: m.AuthCard })))
const DetailModal = lazy(() =>
  import('@/components/detail/DetailModal').then((m) => ({ default: m.DetailModal })))
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage')
    .then((m) => ({ default: m.ForgotPasswordPage })))
const SetPasswordPage = lazy(() =>
  import('@/pages/SetPasswordPage')
    .then((m) => ({ default: m.SetPasswordPage })))
const StorePage = lazy(() =>
  import('@/pages/StorePage').then((m) => ({ default: m.StorePage })))
const BookingPage = lazy(() =>
  import('@/pages/BookingPage').then((m) => ({ default: m.BookingPage })))
const ShopPage = lazy(() =>
  import('@/pages/ShopPage').then((m) => ({ default: m.ShopPage })))
const ProductPage = lazy(() =>
  import('@/pages/ProductPage').then((m) => ({ default: m.ProductPage })))
const SupportPage = lazy(() =>
  import('@/pages/SupportPage').then((m) => ({ default: m.SupportPage })))
const AdminPage = lazy(() =>
  import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })))
const AdminSupportPage = lazy(() =>
  import('@/pages/AdminSupportPage').then((m) => ({ default: m.AdminSupportPage })))
const AdminLoginPage = lazy(() =>
  import('@/pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })))
const AdminStoresPage = lazy(() =>
  import('@/pages/AdminStoresPage').then((m) => ({ default: m.AdminStoresPage })))
const SecretAdminPage = lazy(() =>
  import('@/pages/SecretAdminPage').then((m) => ({ default: m.SecretAdminPage })))
const ForBusinessPage = lazy(() =>
  import('@/pages/ForBusinessPage').then((m) => ({ default: m.ForBusinessPage })))
const TicketAccessPage = lazy(() =>
  import('@/pages/TicketAccessPage').then((m) => ({ default: m.TicketAccessPage })))
const StoreDashboardPage = lazy(() =>
  import('@/pages/StoreDashboardPage').then((m) => ({ default: m.StoreDashboardPage })))
const CompleteSignupPage = lazy(() =>
  import('@/pages/CompleteSignupPage').then((m) => ({ default: m.CompleteSignupPage })))
const CartPage = lazy(() =>
  import('@/pages/CartPage').then((m) => ({ default: m.CartPage })))
const OrderResultPage = lazy(() =>
  import('@/pages/OrderResultPage').then((m) => ({ default: m.OrderResultPage })))
const BookingManagePage = lazy(() =>
  import('@/pages/BookingManagePage')
    .then((m) => ({ default: m.BookingManagePage })))
const MyBookingsPage = lazy(() =>
  import('@/pages/MyBookingsPage').then((m) => ({ default: m.MyBookingsPage })))

/**
 * Page-shaped skeleton while a split route arrives.
 *
 * Two shapes, chosen by route, because one shape cannot fit both kinds of page
 * here and trying made things worse than leaving it alone:
 *
 *   catalogue  (/pets, /adoption)  a max-w-7xl grid of three-column cards
 *   column     (/me, /bookings,    a max-w-2xl stack, the container those
 *               /feed, /followers)  pages actually use
 *
 * The history, since it argues for keeping this honest. It was a max-w-7xl
 * six-card grid for everything. On /me that painted 944px, then the page's own
 * skeleton at 594px, then content — two jumps, measured as 0.095 CLS blamed on
 * the footer. Narrowing it to a column fixed the guarded routes and broke /pets
 * (0.000 -> 0.242) and /adoption (0.000 -> 0.155), whose real skeletons are the
 * grid that had just been removed.
 *
 * Sizes below are measured at 390px, not guessed: catalogue cards are 371px
 * (/pets) and 435px (/adoption); the column pages are 90-172px rows. NotFound
 * has no shape of its own and takes the column, which is closest.
 */
const CATALOGUE_ROUTES = ['/pets', '/adoption']

function RouteFallback({ pathname }: { pathname: string }) {
  if (CATALOGUE_ROUTES.some((p) => pathname.startsWith(p))) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto h-8 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="mx-auto mt-4 h-4 w-72 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            /* Mirrors the real card's box model, which is what makes the
               heights match: the picture runs edge to edge and only the text
               block below it is padded. An earlier version padded the whole
               card, narrowing the picture by 32px and leaving the fallback
               41px short — 0.129 CLS on desktop /pets. */
            <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
              <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
      <div className="h-8 w-1/3 animate-pulse rounded-xl bg-muted" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl bg-card p-5 shadow-soft">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Page transition wrapper — uses the SHARED entrance tokens
 * (100ms / cubic-bezier(.16,1,.3,1) / 20px) from src/lib/motion.ts.
 * Sync AnimatePresence below mounts the NEW route immediately so content
 * never lags behind the URL even when a frame is throttled.
 */
function AnimatedPage({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <motion.div
      /* The exiting page is taken out of flow. With both pages in the normal
         document flow, the outgoing one kept its full height while the
         incoming one rendered below it, and removing it afterwards pulled
         everything up — 0.28 CLS on the four guarded routes under CPU
         throttling, all of it the footer moving. Absolute positioning during
         exit cuts the outgoing page out of the layout so the incoming one
         takes the space immediately. `width: 100%` keeps it the same width,
         since an absolutely positioned box no longer stretches to its
         parent. */
      exit={{ opacity: 0, y: dim ? 0 : MOTION.closeDistance, position: 'absolute', width: '100%' }}
      initial={{ opacity: 0, y: dim ? 0 : MOTION.distance }}
      animate={{ opacity: 1, y: 0 }}
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
  // هر مسیر جدید از بالای صفحه شروع شود. بدون این، پیمایش از انتهای یک صفحه‌ی
  // بلند، نمای پایینی صفحه‌ی بعدی را نشان می‌دهد.
  //
  // Two separate mechanisms produced the "jumps to the products on load" report,
  // and a single scrollTo fixed neither:
  //
  //   1. Scroll anchoring. The rails below the hero fill in after first paint
  //      (React Query returns later), and the browser keeps its chosen anchor
  //      element in view — which moved the page down as content appeared.
  //      Measured on the live site: an untouched load of "/" ended at
  //      scrollY=1482 with the h1 at top=-1268, i.e. above the viewport.
  //      `overflow-anchor: none` on the root turns that off.
  //
  //   2. Timing. Scrolling to 0 while the document is still short is a no-op,
  //      so it has to happen again once the page has grown. A frame is not
  //      enough for that; a short settle window is, and it costs nothing when
  //      the page was already at the top.
  useEffect(() => {
    const root = document.documentElement
    root.style.overflowAnchor = 'none'

    const toTop = () => window.scrollTo({ top: 0, behavior: 'auto' })

    toTop()
    const frame = requestAnimationFrame(toTop)
    const timers = [50, 150, 400].map((ms) => window.setTimeout(toTop, ms))

    return () => {
      cancelAnimationFrame(frame)
      timers.forEach((t) => window.clearTimeout(t))
      root.style.overflowAnchor = ''
    }
  }, [location.pathname, location.search])
  // The Explore view is a full-height app surface — no footer there
  const isExplore = location.pathname === '/explore'

  return (
    <div className="flex min-h-svh flex-col">
      {/* `key` remounts the navbar per route, which is what closes the mobile
          sheet on navigation — resetting it from an effect is a setState-in-
          effect the lint rule refuses, and the sheet is the only state that
          has to be dropped (theme and auth live in stores). */}
      <Navbar key={location.pathname} />

      <main className="flex-1">
        {/*
          Sync mode (not "wait"): the incoming route mounts IMMEDIATELY
          while the old one fades out. With mode="wait" a frozen exit
          animation (occluded/background window) stranded users on a URL
          whose content never swapped — content/URL sync beats staged exits.
        */}
        <AnimatePresence initial={false}>
          <Suspense fallback={<RouteFallback pathname={location.pathname} />}>
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
              path="/store/dashboard/:token"
              element={
                <AnimatedPage>
                  <StoreDashboardPage />
                </AnimatedPage>
              }
            />
            {/*
              The public page a clinic puts in its Instagram bio. It sits
              after the dashboard route on purpose: both are `/store/…`, and
              a static segment wins over a dynamic one in React Router, so
              `/store/dashboard/abc` still opens the dashboard.
            */}
            <Route
              path="/store/:slug"
              element={
                <AnimatedPage>
                  <StorePage />
                </AnimatedPage>
              }
            />
            <Route
              path="/support"
              element={
                <AnimatedPage>
                  <SupportPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/for-business"
              element={
                <AnimatedPage>
                  <ForBusinessPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/support/ticket/:access"
              element={
                <AnimatedPage>
                  <TicketAccessPage />
                </AnimatedPage>
              }
            />
            {/* Public, unguarded on purpose: this is the door, so it must
                not itself require the thing it grants. */}
            <Route
              path="/admin/login"
              element={
                <AnimatedPage>
                  <AdminLoginPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/admin"
              element={
                <AnimatedPage>
                  <RequireAdmin>
                    <AdminPage />
                  </RequireAdmin>
                </AnimatedPage>
              }
            />
            <Route
              path="/admin/stores"
              element={
                <AnimatedPage>
                  <RequireAdmin>
                    <AdminStoresPage />
                  </RequireAdmin>
                </AnimatedPage>
              }
            />
            <Route
              path="/admin/support"
              element={
                <AnimatedPage>
                  <RequireAdmin>
                    <AdminSupportPage />
                  </RequireAdmin>
                </AnimatedPage>
              }
            />
            <Route
              path="/welcome"
              element={
                <AnimatedPage>
                  <CompleteSignupPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/shop"
              element={
                <AnimatedPage>
                  <ShopPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/shop/:id"
              element={
                <AnimatedPage>
                  <ProductPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/cart"
              element={
                <AnimatedPage>
                  <CartPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/order/result"
              element={
                <AnimatedPage>
                  <OrderResultPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/booking/manage/:token"
              element={
                <AnimatedPage>
                  <BookingManagePage />
                </AnimatedPage>
              }
            />
            <Route
              path="/booking/:storeId"
              element={
                <AnimatedPage>
                  <BookingPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/bookings"
              element={
                <AnimatedPage>
                  <RequireAuth>
                    <MyBookingsPage />
                  </RequireAuth>
                </AnimatedPage>
              }
            />
            <Route
              path="/forgot"
              element={
                <AnimatedPage>
                  <ForgotPasswordPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/set-password"
              element={
                <AnimatedPage>
                  <SetPasswordPage />
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
              path="/pet/:id/followers"
              element={
                <AnimatedPage>
                  <FollowListPage />
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
              path="/:secret/enter"
              element={
                <AnimatedPage>
                  <SecretAdminPage />
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
          </Suspense>
        </AnimatePresence>
      </main>

      {!isExplore && <Footer />}

      {/* Global detail sheet — opened by cards, map pins, and rails.
          Lazy for the same reason the pages are: it is a modal that only
          appears on a tap, and it is the one component pulling the full shop
          enrichment map (phone, hours, description, website) into the bundle.
          Every page was already split; this was the last eager piece. */}
      <Suspense fallback={null}>
        <DetailModal />
      </Suspense>
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
